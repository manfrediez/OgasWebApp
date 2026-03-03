import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import {
  WorkoutPlan,
  WorkoutPlanDocument,
} from '../workout-plans/schemas/workout-plan.schema';
import {
  GoalRace,
  GoalRaceDocument,
} from '../goal-races/schemas/goal-race.schema';
import {
  RaceStrategy,
  RaceStrategyDocument,
} from '../race-strategies/schemas/race-strategy.schema';
import {
  StrengthCircuit,
  StrengthCircuitDocument,
} from '../strength-circuits/schemas/strength-circuit.schema';
import {
  AthleteMetrics,
  AthleteMetricsDocument,
} from '../athlete-metrics/schemas/athlete-metrics.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { assertAccess } from '../common/helpers/access.helper';
import { WorkoutType, SessionStatus } from '../common/enums';

interface Layout {
  labelCol: number; // 0-based column index for labels (A=0 or B=1)
  dataCol: number; // 0-based column for main data (C=2 or D=3)
}

interface ParsedGoalRace {
  distance: string;
  date: Date;
  name: string;
  location: string;
  result?: {
    generalPosition?: number;
    categoryPosition?: number;
    time?: string;
  };
}

interface ParsedSession {
  date: Date;
  dayOfWeek: number;
  type: WorkoutType;
  coachNotes: string;
  secondaryType?: WorkoutType;
  secondaryDescription?: string;
  alternativeLabel?: string;
  alternativeDescription?: string;
  athleteFeedback?: string;
  competitionName?: string;
  competitionDistance?: string;
  competitionLocation?: string;
}

interface ParsedWeek {
  weekNumber: number;
  sessions: ParsedSession[];
}

export interface ImportResult {
  plans: number;
  goalRaces: number;
  strategies: number;
  circuits: number;
  metricsUpdated: boolean;
}

const DAY_MAP: Record<string, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  MIÉRCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  SÁBADO: 6,
  DOMINGO: 7,
};

const TYPE_MAP: Record<string, WorkoutType> = {
  INTERVAL: WorkoutType.INTERVAL,
  INTERVALOS: WorkoutType.INTERVAL,
  CONTINUO: WorkoutType.CONTINUOUS,
  DESNIVEL: WorkoutType.ELEVATION,
  BICI: WorkoutType.BIKE,
  COMPETENCIA: WorkoutType.COMPETITION,
  ACTIVACION: WorkoutType.ACTIVATION,
  ACTIVACIÓN: WorkoutType.ACTIVATION,
  DESCANSO: WorkoutType.REST,
  CALIDAD: WorkoutType.QUALITY,
  QUALITY: WorkoutType.QUALITY,
  FUERZA: WorkoutType.STRENGTH,
};

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectModel(WorkoutPlan.name)
    private workoutPlanModel: Model<WorkoutPlanDocument>,
    @InjectModel(GoalRace.name)
    private goalRaceModel: Model<GoalRaceDocument>,
    @InjectModel(RaceStrategy.name)
    private raceStrategyModel: Model<RaceStrategyDocument>,
    @InjectModel(StrengthCircuit.name)
    private strengthCircuitModel: Model<StrengthCircuitDocument>,
    @InjectModel(AthleteMetrics.name)
    private athleteMetricsModel: Model<AthleteMetricsDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async importFromExcel(
    buffer: Buffer,
    athleteId: string,
    coachId: string,
    role: string,
  ): Promise<ImportResult> {
    await assertAccess(coachId, role, athleteId, this.userModel);

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const athleteOid = new Types.ObjectId(athleteId);
    const coachOid = new Types.ObjectId(coachId);

    const result: ImportResult = {
      plans: 0,
      goalRaces: 0,
      strategies: 0,
      circuits: 0,
      metricsUpdated: false,
    };

    // Collect all goal races from all plan sheets for deduplication
    const allGoalRaces: ParsedGoalRace[] = [];

    // 1. Parse plan sheets (numeric names: 3, 4, 5, 6, 7, 8, 9, 10)
    const planSheets = workbook.SheetNames.filter((n) =>
      /^\d+$/.test(n.trim()),
    ).sort((a, b) => parseInt(a) - parseInt(b));

    const planDataList: Array<{
      sheetName: string;
      ws: XLSX.WorkSheet;
      layout: Layout;
    }> = [];

    for (const sheetName of planSheets) {
      const ws = workbook.Sheets[sheetName];
      const layout = this.detectLayout(ws);
      planDataList.push({ sheetName, ws, layout });
      const races = this.parseGoalRaces(ws, layout);
      allGoalRaces.push(...races);
    }

    // 2. Create goal races (deduplicated by name+date)
    const raceIdMap = new Map<string, Types.ObjectId>();
    const uniqueRaces = this.deduplicateRaces(allGoalRaces);
    for (const race of uniqueRaces) {
      const existing = await this.goalRaceModel
        .findOne({
          athleteId: athleteOid,
          name: race.name,
          date: race.date,
        })
        .lean();

      if (existing) {
        // Update result if we have new data
        if (race.result && !existing.result?.time) {
          await this.goalRaceModel.findByIdAndUpdate(existing._id, {
            result: race.result,
          });
        }
        raceIdMap.set(`${race.name}|${race.date.toISOString()}`, existing._id);
      } else {
        const created = await this.goalRaceModel.create({
          athleteId: athleteOid,
          coachId: coachOid,
          name: race.name,
          distance: race.distance,
          date: race.date,
          location: race.location,
          result: race.result,
        });
        raceIdMap.set(
          `${race.name}|${race.date.toISOString()}`,
          created._id as Types.ObjectId,
        );
        result.goalRaces++;
      }
    }

    // 3. Parse & upsert athlete data (DATOS sheet)
    const datosSheet = this.findSheet(workbook, 'DATOS');
    if (datosSheet) {
      const metricsData = this.parseAthleteData(datosSheet);
      if (metricsData) {
        await this.athleteMetricsModel.findOneAndUpdate(
          { athleteId: athleteOid },
          { $set: { ...metricsData, athleteId: athleteOid } },
          { upsert: true },
        );
        result.metricsUpdated = true;
      }
    }

    // 4. Create workout plans (one per numeric sheet)
    for (const { sheetName, ws, layout } of planDataList) {
      const header = this.parsePlanHeader(ws, layout);
      const stimuli = this.parseStimuli(ws, layout);
      const activation = this.parseActivation(ws, layout);
      const generalNotes = this.parseGeneralNotes(ws, layout);
      const weeks = this.parseSessions(ws, layout);
      const conclusions = this.parseConclusions(ws, layout);

      const plan = await this.workoutPlanModel.create({
        athleteId: athleteOid,
        coachId: coachOid,
        name: `Plan ${sheetName}`,
        startDate: header.startDate || new Date(),
        endDate: header.endDate || new Date(),
        planNumber: parseInt(sheetName),
        sport: header.sport || 'RUNNING',
        weeklyStimuli: stimuli,
        totalWeeklyStimuli: stimuli.reduce(
          (sum, s) => sum + s.days.filter(Boolean).length,
          0,
        ),
        activationProtocol: activation,
        generalNotes,
        coachConclusions: conclusions,
        weeks: weeks.map((w) => ({
          weekNumber: w.weekNumber,
          sessions: w.sessions.map((s) => ({
            ...s,
            status: SessionStatus.PLANNED,
          })),
        })),
      });

      // 5. Parse strength circuits for this plan
      const circuits = this.parseStrengthCircuits(ws, layout);
      const circuitIds: Types.ObjectId[] = [];
      for (const circuit of circuits) {
        const created = await this.strengthCircuitModel.create({
          ...circuit,
          coachId: coachOid,
          planId: plan._id,
        });
        circuitIds.push(created._id as Types.ObjectId);
        result.circuits++;
      }

      if (circuitIds.length > 0) {
        await this.workoutPlanModel.findByIdAndUpdate(plan._id, {
          strengthRoutines: circuitIds,
        });
      }

      result.plans++;
    }

    // 6. Parse race strategies
    const stratSheet = this.findSheet(workbook, 'Estrategias');
    if (stratSheet) {
      const strategies = this.parseRaceStrategies(stratSheet);
      for (const strat of strategies) {
        await this.raceStrategyModel.create({
          ...strat,
          athleteId: athleteOid,
          coachId: coachOid,
        });
        result.strategies++;
      }
    }

    this.logger.log(
      `Import completed for athlete ${athleteId}: ${JSON.stringify(result)}`,
    );

    return result;
  }

  // ---------------------------------------------------------------------------
  // Layout detection
  // ---------------------------------------------------------------------------

  private detectLayout(ws: XLSX.WorkSheet): Layout {
    // Sheets 3-5 have labels in col A (0), data in col C (2)
    // Sheets 6-10 have labels in col B (1), data in col D (3)
    // Detect by checking if cell B2 or B3 contains a known label keyword
    const b2 = this.cellStr(ws, 1, 1); // B2
    const b3 = this.cellStr(ws, 2, 1); // B3
    const a2 = this.cellStr(ws, 1, 0); // A2
    const a3 = this.cellStr(ws, 2, 0); // A3

    const knownLabels = [
      'CARRERA',
      'FECHA',
      'INICIO',
      'PLAN',
      'DEPORTE',
      'DISTANCIA',
    ];
    const bHasLabel =
      knownLabels.some((l) => b2.toUpperCase().includes(l)) ||
      knownLabels.some((l) => b3.toUpperCase().includes(l));
    const aHasLabel =
      knownLabels.some((l) => a2.toUpperCase().includes(l)) ||
      knownLabels.some((l) => a3.toUpperCase().includes(l));

    if (bHasLabel && !aHasLabel) {
      return { labelCol: 1, dataCol: 3 }; // B/D layout
    }
    // Default: A/C layout
    return { labelCol: 0, dataCol: 2 };
  }

  // ---------------------------------------------------------------------------
  // Plan header parsing
  // ---------------------------------------------------------------------------

  private parsePlanHeader(
    ws: XLSX.WorkSheet,
    layout: Layout,
  ): {
    startDate: Date | null;
    endDate: Date | null;
    planNumber: number | null;
    sport: string;
  } {
    const result = {
      startDate: null as Date | null,
      endDate: null as Date | null,
      planNumber: null as number | null,
      sport: '',
    };

    // Scan first 15 rows for header data
    for (let r = 0; r < 15; r++) {
      const label = this.cellStr(ws, r, layout.labelCol).toUpperCase();
      const value = this.cellValue(ws, r, layout.dataCol);

      if (label.includes('INICIO') || label.includes('FECHA INICIO')) {
        result.startDate = this.parseDate(value);
      } else if (label.includes('FIN') || label.includes('FECHA FIN')) {
        result.endDate = this.parseDate(value);
      } else if (label.includes('PLAN') && !label.includes('PLANIF')) {
        const num = parseInt(String(value));
        if (!isNaN(num)) result.planNumber = num;
      } else if (label.includes('DEPORTE')) {
        result.sport = String(value || '').trim();
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Goal races parsing (rows 5-8 of each plan sheet)
  // ---------------------------------------------------------------------------

  private parseGoalRaces(ws: XLSX.WorkSheet, layout: Layout): ParsedGoalRace[] {
    const races: ParsedGoalRace[] = [];
    // Goal races are typically in rows 5-8 (0-indexed: 4-7)
    // Offset columns based on layout
    const offset = layout.labelCol; // 0 for A-layout, 1 for B-layout

    for (let r = 3; r <= 8; r++) {
      // Check if this row has race data
      const distCell = this.cellStr(ws, r, 3 + offset); // D or E
      const dateCell = this.cellValue(ws, r, 4 + offset); // E or F
      const nameCell = this.cellStr(ws, r, 5 + offset); // F or G

      if (!nameCell && !distCell) continue;

      const date = this.parseDate(dateCell);
      if (!date && !nameCell) continue;

      const locationCell = this.cellStr(ws, r, 7 + offset); // H or I

      // Result columns (K, L, M = 10, 11, 12)
      const genPos = this.cellNum(ws, r, 10);
      const catPos = this.cellNum(ws, r, 11);
      const time = this.cellStr(ws, r, 12);

      const hasResult = genPos || catPos || time;

      if (nameCell || distCell) {
        races.push({
          distance: distCell || '',
          date: date || new Date(),
          name: nameCell || distCell || '',
          location: locationCell || '',
          result: hasResult
            ? {
                generalPosition: genPos || undefined,
                categoryPosition: catPos || undefined,
                time: time || undefined,
              }
            : undefined,
        });
      }
    }

    return races;
  }

  // ---------------------------------------------------------------------------
  // Weekly stimuli parsing
  // ---------------------------------------------------------------------------

  private parseStimuli(
    ws: XLSX.WorkSheet,
    layout: Layout,
  ): Array<{ activity: string; days: boolean[] }> {
    const stimuli: Array<{ activity: string; days: boolean[] }> = [];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Find the stimuli section - look for "ESTIMULOS" or "ESTÍMULOS" keyword
    let startRow = -1;
    for (let r = 10; r < Math.min(range.e.r, 35); r++) {
      const cell = this.cellStr(ws, r, layout.labelCol).toUpperCase();
      if (cell.includes('ESTIMULO') || cell.includes('ESTÍMULO')) {
        startRow = r + 1;
        break;
      }
    }

    if (startRow < 0) return stimuli;

    // Parse stimulus rows until empty
    for (let r = startRow; r < startRow + 20; r++) {
      const activity = this.cellStr(ws, r, layout.labelCol);
      if (!activity) break;

      const days: boolean[] = [];
      // 7 days columns after the label
      for (let d = 0; d < 7; d++) {
        const val = this.cellStr(ws, r, layout.dataCol + d).toUpperCase();
        days.push(val === 'X' || val === 'SI' || val === 'SÍ');
      }
      stimuli.push({ activity, days });
    }

    return stimuli;
  }

  // ---------------------------------------------------------------------------
  // Activation protocol
  // ---------------------------------------------------------------------------

  private parseActivation(ws: XLSX.WorkSheet, layout: Layout): string {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let r = 0; r < Math.min(range.e.r, 50); r++) {
      const cell = this.cellStr(ws, r, layout.labelCol).toUpperCase();
      if (cell.includes('ACTIVACION') || cell.includes('ACTIVACIÓN')) {
        // The activation content is typically in the data column
        const content = this.cellStr(ws, r, layout.dataCol);
        if (content) return content;
        // Or on the next row
        const next = this.cellStr(ws, r + 1, layout.dataCol);
        return next || '';
      }
    }

    return '';
  }

  // ---------------------------------------------------------------------------
  // General notes
  // ---------------------------------------------------------------------------

  private parseGeneralNotes(ws: XLSX.WorkSheet, layout: Layout): string[] {
    const notes: string[] = [];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let r = 0; r < Math.min(range.e.r, 50); r++) {
      const cell = this.cellStr(ws, r, layout.labelCol).toUpperCase();
      if (
        cell.includes('NOTA') ||
        cell.includes('GENERAL') ||
        cell.includes('HIDRATACION') ||
        cell.includes('HIDRATACIÓN') ||
        cell.includes('NUTRICION') ||
        cell.includes('NUTRICIÓN')
      ) {
        const content = this.cellStr(ws, r, layout.dataCol);
        if (content) notes.push(content);
      }
    }

    return notes;
  }

  // ---------------------------------------------------------------------------
  // Sessions parsing (SEMANA N anchors)
  // ---------------------------------------------------------------------------

  private parseSessions(ws: XLSX.WorkSheet, layout: Layout): ParsedWeek[] {
    const weeks: ParsedWeek[] = [];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Find all "SEMANA N" anchors
    const weekAnchors: Array<{ row: number; weekNum: number }> = [];
    for (let r = 0; r <= range.e.r; r++) {
      // Check both label col and adjacent columns for SEMANA markers
      for (let c = 0; c <= Math.min(range.e.c, 3); c++) {
        const cell = this.cellStr(ws, r, c).toUpperCase().trim();
        const match = cell.match(/SEMANA\s+(\d+)/);
        if (match) {
          weekAnchors.push({ row: r, weekNum: parseInt(match[1]) });
          break;
        }
      }
    }

    // Parse sessions between anchors
    for (let i = 0; i < weekAnchors.length; i++) {
      const anchor = weekAnchors[i];
      const endRow =
        i + 1 < weekAnchors.length
          ? weekAnchors[i + 1].row
          : range.e.r + 1;

      const sessions = this.parseWeekSessions(
        ws,
        layout,
        anchor.row + 1,
        endRow,
      );
      weeks.push({ weekNumber: anchor.weekNum, sessions });
    }

    return weeks;
  }

  private parseWeekSessions(
    ws: XLSX.WorkSheet,
    layout: Layout,
    startRow: number,
    endRow: number,
  ): ParsedSession[] {
    const sessions: ParsedSession[] = [];
    const offset = layout.labelCol;

    for (let r = startRow; r < endRow; r++) {
      // Column mapping (adjusted by layout offset):
      // A/B: date, B/C: day name, C/D: type, D/E: description,
      // F/G: secondary, H/I+I/J: alternative, K/L: feedback
      const dateVal = this.cellValue(ws, r, 0 + offset);
      const dayStr = this.cellStr(ws, r, 1 + offset).toUpperCase().trim();
      const typeStr = this.cellStr(ws, r, 2 + offset).toUpperCase().trim();
      const description = this.cellStr(ws, r, 3 + offset);

      // Skip empty rows or header rows
      if (!dayStr && !typeStr && !description) continue;
      if (dayStr === 'DIA' || dayStr === 'DÍA' || typeStr === 'TIPO') continue;

      const dayOfWeek = DAY_MAP[dayStr] || 0;
      if (!dayOfWeek && !typeStr) continue;

      const date = this.parseDate(dateVal);
      const type = this.mapWorkoutType(typeStr);

      // Check for secondary type (column F/G)
      const secondaryStr = this.cellStr(ws, r, 5 + offset).toUpperCase().trim();
      let secondaryType: WorkoutType | undefined;
      let secondaryDescription: string | undefined;
      if (secondaryStr.includes('FUERZA')) {
        secondaryType = WorkoutType.STRENGTH;
        secondaryDescription = this.cellStr(ws, r, 5 + offset);
      }

      // Alternative workout (columns H+I / I+J)
      const altLabel = this.cellStr(ws, r, 7 + offset);
      const altDesc = this.cellStr(ws, r, 8 + offset);

      // Athlete feedback (column K / L)
      const feedback = this.cellStr(ws, r, 10);

      // Competition data from description
      let competitionName: string | undefined;
      let competitionDistance: string | undefined;
      let competitionLocation: string | undefined;
      if (type === WorkoutType.COMPETITION && description) {
        competitionName = description;
      }

      sessions.push({
        date: date || new Date(),
        dayOfWeek,
        type,
        coachNotes: description,
        secondaryType,
        secondaryDescription,
        alternativeLabel: altLabel || undefined,
        alternativeDescription: altDesc || undefined,
        athleteFeedback: feedback || undefined,
        competitionName,
        competitionDistance,
        competitionLocation,
      });
    }

    return sessions;
  }

  // ---------------------------------------------------------------------------
  // Strength circuits parsing
  // ---------------------------------------------------------------------------

  private parseStrengthCircuits(
    ws: XLSX.WorkSheet,
    layout: Layout,
  ): Array<{
    circuitNumber: number;
    name: string;
    exercises: Array<{ name: string; reps: string; notes: string }>;
    timerFormat: string;
    routineNumber: number;
  }> {
    const circuits: Array<{
      circuitNumber: number;
      name: string;
      exercises: Array<{ name: string; reps: string; notes: string }>;
      timerFormat: string;
      routineNumber: number;
    }> = [];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Find "PREPARACION FISICA" anchor
    let startRow = -1;
    for (let r = 0; r <= range.e.r; r++) {
      for (let c = 0; c <= Math.min(range.e.c, 5); c++) {
        const cell = this.cellStr(ws, r, c).toUpperCase();
        if (
          cell.includes('PREPARACION FISICA') ||
          cell.includes('PREPARACIÓN FÍSICA')
        ) {
          startRow = r + 1;
          break;
        }
      }
      if (startRow >= 0) break;
    }

    if (startRow < 0) return circuits;

    // Find "CONCLUSIONES" or end to know where circuits end
    let endRow = range.e.r;
    for (let r = startRow; r <= range.e.r; r++) {
      for (let c = 0; c <= Math.min(range.e.c, 3); c++) {
        const cell = this.cellStr(ws, r, c).toUpperCase();
        if (cell.includes('CONCLUSI')) {
          endRow = r;
          break;
        }
      }
    }

    // Parse circuit blocks
    let currentCircuit: {
      circuitNumber: number;
      name: string;
      exercises: Array<{ name: string; reps: string; notes: string }>;
      timerFormat: string;
      routineNumber: number;
    } | null = null;

    for (let r = startRow; r < endRow; r++) {
      const col0 = this.cellStr(ws, r, layout.labelCol).trim();
      const col1 = this.cellStr(ws, r, layout.labelCol + 1).trim();
      const upperCol0 = col0.toUpperCase();

      // Check if this is a circuit number header (e.g., "1", "2", "3")
      // or a circuit name like "CIRCUITO 1"
      const circuitMatch =
        upperCol0.match(/^CIRCUITO\s*(\d+)/) ||
        upperCol0.match(/^RUTINA\s*(\d+)/);
      const isNumHeader = /^\d+$/.test(col0) && col1;

      if (circuitMatch || isNumHeader) {
        if (currentCircuit) circuits.push(currentCircuit);

        const num = circuitMatch
          ? parseInt(circuitMatch[1])
          : parseInt(col0);
        const name = circuitMatch
          ? col1 || `Circuito ${num}`
          : col1 || `Circuito ${num}`;

        currentCircuit = {
          circuitNumber: num,
          name,
          exercises: [],
          timerFormat: '',
          routineNumber: num,
        };
        continue;
      }

      // Timer format line
      if (upperCol0.includes('TIMER') || upperCol0.includes("''")) {
        if (currentCircuit) {
          currentCircuit.timerFormat = col0;
        }
        continue;
      }

      // Exercise line
      if (currentCircuit && col0 && !upperCol0.includes('EJERCICIO')) {
        const reps = col1 || '';
        const notes = this.cellStr(ws, r, layout.labelCol + 2);
        currentCircuit.exercises.push({ name: col0, reps, notes });
      }
    }

    if (currentCircuit) circuits.push(currentCircuit);

    return circuits;
  }

  // ---------------------------------------------------------------------------
  // Conclusions
  // ---------------------------------------------------------------------------

  private parseConclusions(ws: XLSX.WorkSheet, layout: Layout): string {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    for (let r = range.e.r; r >= 0; r--) {
      for (let c = 0; c <= Math.min(range.e.c, 3); c++) {
        const cell = this.cellStr(ws, r, c).toUpperCase();
        if (cell.includes('CONCLUSI')) {
          // Gather conclusion text from nearby cells
          const parts: string[] = [];
          for (let cr = r; cr <= Math.min(r + 10, range.e.r); cr++) {
            const text = this.cellStr(ws, cr, layout.dataCol);
            if (text) parts.push(text);
            // Also check next columns
            const text2 = this.cellStr(ws, cr, layout.dataCol + 1);
            if (text2) parts.push(text2);
          }
          return parts.join('\n').trim();
        }
      }
    }

    return '';
  }

  // ---------------------------------------------------------------------------
  // Race strategies parsing
  // ---------------------------------------------------------------------------

  private parseRaceStrategies(
    ws: XLSX.WorkSheet,
  ): Array<{
    raceName: string;
    raceDate: Date;
    totalDistance: number;
    segments: Array<{
      fromKm: number;
      toKm: number;
      objective: string;
      paceZone: string;
      technicalFocus: string;
      strategicKey: string;
    }>;
    preRaceActivation?: string;
    generalTechnique?: string;
  }> {
    const strategies: Array<{
      raceName: string;
      raceDate: Date;
      totalDistance: number;
      segments: Array<{
        fromKm: number;
        toKm: number;
        objective: string;
        paceZone: string;
        technicalFocus: string;
        strategicKey: string;
      }>;
      preRaceActivation?: string;
      generalTechnique?: string;
    }> = [];

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    let currentStrategy: (typeof strategies)[0] | null = null;

    for (let r = 0; r <= range.e.r; r++) {
      const col0 = this.cellStr(ws, r, 0).trim();
      const col1 = this.cellStr(ws, r, 1).trim();
      const upper0 = col0.toUpperCase();

      // Detect strategy title blocks (usually race name with distance and location)
      // Pattern: "CAMPEONATO MASTER – MAR DEL PLATA – 12K" or similar
      if (
        upper0.length > 5 &&
        !upper0.startsWith('KM') &&
        !upper0.includes('SEGMENTO') &&
        (upper0.includes('–') ||
          upper0.includes('-') ||
          upper0.match(/\d+\s*K/i))
      ) {
        // Check if this looks like a title (no KM pattern, has a race-like name)
        const isTitle =
          !upper0.match(/^KM\s+\d/) && !upper0.match(/^\d+-\d+/);
        if (isTitle) {
          if (currentStrategy) strategies.push(currentStrategy);

          const distMatch = col0.match(/(\d+)\s*K/i);
          currentStrategy = {
            raceName: col0,
            raceDate: new Date(),
            totalDistance: distMatch ? parseInt(distMatch[1]) : 0,
            segments: [],
          };
          continue;
        }
      }

      // Segment rows: "KM 0-3", "KM 3-6", etc.
      if (currentStrategy) {
        const kmMatch =
          upper0.match(/KM\s*(\d+)\s*[-–]\s*(\d+)/) ||
          col0.match(/(\d+)\s*[-–]\s*(\d+)/);
        if (kmMatch) {
          const fromKm = parseInt(kmMatch[1]);
          const toKm = parseInt(kmMatch[2]);
          const objective = col1 || '';
          const paceZone = this.cellStr(ws, r, 2);
          const technicalFocus = this.cellStr(ws, r, 3);
          const strategicKey = this.cellStr(ws, r, 4);

          currentStrategy.segments.push({
            fromKm,
            toKm,
            objective,
            paceZone,
            technicalFocus,
            strategicKey,
          });
        }

        // Pre-race activation
        if (upper0.includes('ACTIVACION') || upper0.includes('ACTIVACIÓN')) {
          currentStrategy.preRaceActivation = col1 || this.cellStr(ws, r, 2);
        }

        // General technique
        if (upper0.includes('TECNICA') || upper0.includes('TÉCNICA')) {
          currentStrategy.generalTechnique = col1 || this.cellStr(ws, r, 2);
        }
      }
    }

    if (currentStrategy) strategies.push(currentStrategy);

    return strategies;
  }

  // ---------------------------------------------------------------------------
  // Athlete data parsing (DATOS sheet)
  // ---------------------------------------------------------------------------

  private parseAthleteData(
    ws: XLSX.WorkSheet,
  ): Record<string, any> | null {
    const data: Record<string, any> = {};
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const testHistory: Array<{
      type: string;
      date: Date;
      value: number;
      fcMax?: number;
      pace?: string;
    }> = [];

    for (let r = 0; r <= range.e.r; r++) {
      const label = this.cellStr(ws, r, 0).toUpperCase().trim();
      const value = this.cellValue(ws, r, 1);
      const valueStr = this.cellStr(ws, r, 1);

      if (label.includes('EDAD') || label.includes('AGE')) {
        const num = parseInt(String(value));
        if (!isNaN(num)) data.age = num;
      }

      if (label.includes('RESIDENCIA') || label.includes('CIUDAD')) {
        if (valueStr) data.residence = valueStr;
      }

      if (label.includes('OBJETIVO') && label.includes('CORTO')) {
        if (valueStr) data.objectivesShortTerm = valueStr;
      }

      if (label.includes('OBJETIVO') && label.includes('MEDIANO')) {
        if (valueStr) data.objectivesMediumTerm = valueStr;
      }

      if (label.includes('RELOJ') || label.includes('WATCH')) {
        if (valueStr) data['equipment.watch'] = valueStr;
      }

      if (label.includes('BANDA') || label.includes('HR BAND')) {
        if (valueStr) data['equipment.heartRateBand'] = valueStr;
      }

      if (label.includes('BICI') || label.includes('BIKE')) {
        if (valueStr) data['equipment.bike'] = valueStr;
      }

      if (label.includes('VT2') || label.includes('UMBRAL')) {
        const num = parseInt(String(value));
        if (!isNaN(num)) data.vt2 = num;
      }

      if (label.includes('VAM')) {
        const num = parseInt(String(value));
        if (!isNaN(num)) data.vam = num;
      }

      if (label.includes('FC MAX') || label.includes('FCMAX')) {
        const num = parseInt(String(value));
        if (!isNaN(num)) data.fcMax = num;
      }

      if (label.includes('DISPONIBILIDAD') || label.includes('HORAS')) {
        const num = parseInt(String(value));
        if (!isNaN(num)) data.weeklyAvailableHours = num;
      }

      if (label.includes('PISTA') && label.includes('ACCESO')) {
        data.hasTrackAccess =
          valueStr.toUpperCase() === 'SI' ||
          valueStr.toUpperCase() === 'SÍ';
      }

      if (label.includes('UBICACION PISTA') || label.includes('UBICACIÓN PISTA')) {
        if (valueStr) data.trackLocation = valueStr;
      }

      if (label.includes('LIMITACION') || label.includes('LIMITACIÓN')) {
        if (valueStr) data.limitations = valueStr;
      }

      // Test records (VT2 tests, VAM tests, etc.)
      if (label.includes('TEST') && value) {
        const dateVal = this.cellValue(ws, r, 2);
        const testDate = this.parseDate(dateVal);
        const numVal = parseFloat(String(value));
        if (testDate && !isNaN(numVal)) {
          const fcMaxTest = this.cellNum(ws, r, 3);
          const pace = this.cellStr(ws, r, 4);
          testHistory.push({
            type: label.replace('TEST', '').trim() || 'GENERAL',
            date: testDate,
            value: numVal,
            fcMax: fcMaxTest || undefined,
            pace: pace || undefined,
          });
        }
      }
    }

    if (testHistory.length > 0) {
      data.testHistory = testHistory;
    }

    // Flatten nested equipment keys
    const equipment: Record<string, string> = {};
    for (const key of Object.keys(data)) {
      if (key.startsWith('equipment.')) {
        equipment[key.replace('equipment.', '')] = data[key];
        delete data[key];
      }
    }
    if (Object.keys(equipment).length > 0) {
      data.equipment = equipment;
    }

    return Object.keys(data).length > 0 ? data : null;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private findSheet(
    workbook: XLSX.WorkBook,
    partialName: string,
  ): XLSX.WorkSheet | null {
    const upper = partialName.toUpperCase();
    const name = workbook.SheetNames.find((n) =>
      n.toUpperCase().includes(upper),
    );
    return name ? workbook.Sheets[name] : null;
  }

  private cellStr(ws: XLSX.WorkSheet, row: number, col: number): string {
    const addr = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = ws[addr];
    if (!cell) return '';
    if (cell.t === 'd' && cell.v instanceof Date) {
      return cell.v.toISOString().slice(0, 10);
    }
    return String(cell.v ?? '').trim();
  }

  private cellValue(ws: XLSX.WorkSheet, row: number, col: number): any {
    const addr = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = ws[addr];
    return cell?.v ?? null;
  }

  private cellNum(ws: XLSX.WorkSheet, row: number, col: number): number | null {
    const val = this.cellValue(ws, row, col);
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
      // Excel serial date
      const date = XLSX.SSF.parse_date_code(value);
      if (date) return new Date(date.y, date.m - 1, date.d);
    }
    if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
      // Try DD/MM/YYYY format
      const parts = value.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
      if (parts) {
        const year =
          parts[3].length === 2 ? 2000 + parseInt(parts[3]) : parseInt(parts[3]);
        return new Date(year, parseInt(parts[2]) - 1, parseInt(parts[1]));
      }
    }
    return null;
  }

  private mapWorkoutType(type: string): WorkoutType {
    const normalized = type
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    return TYPE_MAP[normalized] || WorkoutType.CONTINUOUS;
  }

  private deduplicateRaces(races: ParsedGoalRace[]): ParsedGoalRace[] {
    const seen = new Map<string, ParsedGoalRace>();
    for (const race of races) {
      const key = `${race.name}|${race.date.toISOString()}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, race);
      } else if (race.result && !existing.result) {
        // Prefer the one with result data
        seen.set(key, race);
      }
    }
    return Array.from(seen.values());
  }
}
