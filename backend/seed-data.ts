import mongoose from 'mongoose';

const COACH_ID = new mongoose.Types.ObjectId('69a6f0e97710376d39d968ed');
const ATHLETE_ID = new mongoose.Types.ObjectId('69a6f0e97710376d39d968ee');

function d(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

async function seedData() {
  const conn = await mongoose.connect('mongodb://localhost:27017/pitu-app');
  const db = conn.connection.db!;
  const now = new Date();

  // ─── 1. WORKOUT PLAN ─────────────────────────────────────────────

  const workoutPlansCol = db.collection('workoutplans');

  // Delete existing plan PITU for this athlete to avoid duplicates
  await workoutPlansCol.deleteMany({ athleteId: ATHLETE_ID, name: 'PITU' });

  const planDoc: any = {
    athleteId: ATHLETE_ID,
    coachId: COACH_ID,
    name: 'PITU',
    planNumber: 10,
    sport: 'RUNNING',
    startDate: d('2026-02-16'),
    endDate: d('2026-03-15'),
    activationProtocol: "TIMER (4 SERIES) 20''X6''X16 - Dorsiflexion / Movilidad toracica / Movilidad de tronco / Aductores dinamicos",
    generalNotes: [
      'Hidratarse bien antes, durante y después de cada sesión',
      'Respetar las zonas de FC indicadas',
      'En caso de dolor o molestia, suspender la sesión y avisar',
      'La bici es complemento activo, no debe generar fatiga residual',
    ],
    weeklyStimuli: [
      { activity: 'Running', days: [false, true, false, true, false, true, true] },
      { activity: 'Prep Fisica', days: [true, true, false, false, true, false, false] },
      { activity: 'Bici', days: [true, true, false, false, true, false, false] },
    ],
    totalWeeklyStimuli: 10,
    strengthRoutines: [],
    weeks: [
      // ── Semana 1 (16/2 - 22/2) ──
      {
        weekNumber: 1,
        sessions: [
          {
            dayOfWeek: 0, date: d('2026-02-16'), type: 'BIKE', secondaryType: 'STRENGTH',
            description: "60' suave", athleteFeedback: '60 min trote suave + GYM',
            status: 'COMPLETED',
          },
          {
            dayOfWeek: 1, date: d('2026-02-17'), type: 'INTERVAL',
            description: "20' Z1/2 + 50' (5' Z4 X 5' Z1/2) + 20' Z1/2",
            athleteFeedback: 'salio muy bueno, promedio 3:47 los Z4 y 5:00 los Z1/2. Me senti comodo y con buena respuesta.',
            status: 'COMPLETED',
          },
          {
            dayOfWeek: 2, date: d('2026-02-18'), type: 'CONTINUOUS', secondaryType: 'STRENGTH',
            description: "60' suave", athleteFeedback: '30 fuerza + 60 trote suave',
            status: 'COMPLETED',
          },
          {
            dayOfWeek: 3, date: d('2026-02-19'), type: 'ELEVATION',
            description: "3X(10'CL Z1/2+10'TA Z1/2+10'TC Z2/3)",
            alternativeDescription: "LLANO 90' Z1/2",
            athleteFeedback: 'un poco mas cansado pero pude hacerlo, las subidas de TC fueron exigentes pero manejables',
            status: 'COMPLETED',
          },
          {
            dayOfWeek: 4, date: d('2026-02-20'), type: 'REST',
            description: '', status: 'PLANNED',
          },
          {
            dayOfWeek: 5, date: d('2026-02-21'), type: 'CONTINUOUS',
            description: "90' Z1/2",
            athleteFeedback: 'buen fondo a 4:50, buenas sensaciones, me senti liviano y con ganas de seguir',
            status: 'COMPLETED',
          },
          {
            dayOfWeek: 6, date: d('2026-02-22'), type: 'ELEVATION',
            description: "10'CL+20'TA+60'(10'CL Z3/4 X 10'TA)",
            alternativeDescription: "LLANO 60' Z1/2",
            athleteFeedback: "metimos en la cruz 20+10+60, muy buena sesion de cerro, me senti fuerte en las subidas",
            status: 'COMPLETED',
          },
        ],
      },
      // ── Semana 2 (23/2 - 1/3) ──
      {
        weekNumber: 2,
        sessions: [
          {
            dayOfWeek: 0, date: d('2026-02-23'), type: 'BIKE', secondaryType: 'STRENGTH',
            description: "60' suave",
            athleteFeedback: '30 gym + 60 bici tranqui + 30 gym',
            status: 'COMPLETED',
          },
          {
            dayOfWeek: 1, date: d('2026-02-24'), type: 'INTERVAL',
            description: "20'Z1/2+20'(1'Z4 X 1'Z1/2)+20'Z1/2",
            athleteFeedback: 'buenas sensaciones, salieron a 3:25 los Z4 y 5:10 los Z1/2. Buen ritmo sin forzar.',
            status: 'COMPLETED',
          },
          {
            dayOfWeek: 2, date: d('2026-02-25'), type: 'CONTINUOUS', secondaryType: 'STRENGTH',
            description: "60' suave", athleteFeedback: 'GYM +',
            status: 'COMPLETED',
          },
          {
            dayOfWeek: 3, date: d('2026-02-26'), type: 'ELEVATION',
            description: "3X(10'CL Z1/2+20'TA Z1/2)",
            alternativeDescription: "LLANO 60' Z1/2",
            status: 'PLANNED',
          },
          {
            dayOfWeek: 4, date: d('2026-02-27'), type: 'REST',
            description: '', status: 'PLANNED',
          },
          {
            dayOfWeek: 5, date: d('2026-02-28'), type: 'ACTIVATION',
            description: "40' Z1/2", status: 'PLANNED',
          },
          {
            dayOfWeek: 6, date: d('2026-03-01'), type: 'COMPETITION',
            description: '12K Campeonato Master Mar del Plata',
            competitionName: '12K Campeonato Master Mar del Plata',
            competitionDistance: '12K',
            competitionLocation: 'Mar del Plata',
            status: 'PLANNED',
          },
        ],
      },
      // ── Semana 3 (2/3 - 8/3) ──
      {
        weekNumber: 3,
        sessions: [
          {
            dayOfWeek: 0, date: d('2026-03-02'), type: 'BIKE', secondaryType: 'STRENGTH',
            description: "60' suave", status: 'PLANNED',
          },
          {
            dayOfWeek: 1, date: d('2026-03-03'), type: 'INTERVAL',
            description: "20'Z1/2+50'(5'Z4 X 5'Z1/2)+20'Z1/2", status: 'PLANNED',
          },
          {
            dayOfWeek: 2, date: d('2026-03-04'), type: 'CONTINUOUS', secondaryType: 'STRENGTH',
            description: "60' suave", status: 'PLANNED',
          },
          {
            dayOfWeek: 3, date: d('2026-03-05'), type: 'ELEVATION',
            description: "3X(15'CL Z1/2+15'TA Z1/2+10'TC Z2/3)",
            alternativeDescription: "LLANO 120' Z1/2",
            status: 'PLANNED',
          },
          {
            dayOfWeek: 4, date: d('2026-03-06'), type: 'REST',
            description: '', status: 'PLANNED',
          },
          {
            dayOfWeek: 5, date: d('2026-03-07'), type: 'CONTINUOUS',
            description: "120' Z1/2", status: 'PLANNED',
          },
          {
            dayOfWeek: 6, date: d('2026-03-08'), type: 'ELEVATION',
            description: "20'CL+20'TA+80'(10'CL Z3/4 X 10'TA)",
            alternativeDescription: "LLANO 80' Z1/2",
            status: 'PLANNED',
          },
        ],
      },
      // ── Semana 4 (9/3 - 15/3) ──
      {
        weekNumber: 4,
        sessions: [
          {
            dayOfWeek: 0, date: d('2026-03-09'), type: 'BIKE', secondaryType: 'STRENGTH',
            description: "60' suave", status: 'PLANNED',
          },
          {
            dayOfWeek: 1, date: d('2026-03-10'), type: 'QUALITY',
            description: "20'Z1/2+20'(200m Z4 X 200m Z1/2)+20'Z1/2", status: 'PLANNED',
          },
          {
            dayOfWeek: 2, date: d('2026-03-11'), type: 'CONTINUOUS', secondaryType: 'STRENGTH',
            description: "50' suave", status: 'PLANNED',
          },
          {
            dayOfWeek: 3, date: d('2026-03-12'), type: 'ACTIVATION',
            description: "40' Z1/2", status: 'PLANNED',
          },
          {
            dayOfWeek: 4, date: d('2026-03-13'), type: 'REST',
            description: '', status: 'PLANNED',
          },
          {
            dayOfWeek: 5, date: d('2026-03-14'), type: 'COMPETITION',
            description: '15K Campeonato Nacional Tafi del Valle',
            competitionName: '15K Campeonato Nacional Tafi del Valle',
            competitionDistance: '15K',
            competitionLocation: 'Tafi del Valle',
            status: 'PLANNED',
          },
          {
            dayOfWeek: 6, date: d('2026-03-15'), type: 'REST',
            description: 'Descanso completo', status: 'PLANNED',
          },
        ],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const planResult = await workoutPlansCol.insertOne(planDoc);
  const planId = planResult.insertedId;
  console.log('Plan PITU creado:', planId.toString());

  // ─── 2. GOAL RACES ───────────────────────────────────────────────

  const goalRacesCol = db.collection('goalraces');

  // Delete existing races for this athlete to avoid duplicates
  await goalRacesCol.deleteMany({ athleteId: ATHLETE_ID });

  const races = [
    { name: '45K TUT Tandil', distance: '45K', date: d('2025-08-10'), location: 'Tandil' },
    { name: '80K UTMB Bariloche', distance: '80K', date: d('2025-11-21'), location: 'Bariloche' },
    { name: '12K MDQ Trail', distance: '12K', date: d('2026-03-01'), location: 'Mar del Plata' },
    { name: '15K Campeonato Nacional', distance: '15K', date: d('2026-03-14'), location: 'Tafi del Valle' },
  ];

  const raceDocs = races.map(r => ({
    athleteId: ATHLETE_ID,
    coachId: COACH_ID,
    ...r,
    createdAt: now,
    updatedAt: now,
  }));

  await goalRacesCol.insertMany(raceDocs);
  console.log(`${raceDocs.length} carreras objetivo creadas`);

  // ─── 3. ATHLETE METRICS ───────────────────────────────────────────

  const athleteMetricsCol = db.collection('athletemetrics');

  // Upsert: delete existing and insert fresh
  await athleteMetricsCol.deleteMany({ athleteId: ATHLETE_ID });

  await athleteMetricsCol.insertOne({
    athleteId: ATHLETE_ID,
    vt2: 87.7,
    testHistory: [
      { type: 'VT2', date: d('2025-05-01'), value: 87.7 },
    ],
    hrZonesDetailed: [
      { zone: 'Z1', percentRange: '60-70%', fcRange: { min: 105, max: 123 }, sensation: 'Muy suave, conversación fluida', rpe: 2 },
      { zone: 'Z2', percentRange: '70-80%', fcRange: { min: 123, max: 140 }, sensation: 'Suave, se puede hablar con frases cortas', rpe: 4 },
      { zone: 'Z3', percentRange: '80-87%', fcRange: { min: 140, max: 153 }, sensation: 'Moderado, cuesta hablar', rpe: 6 },
      { zone: 'Z4', percentRange: '87-93%', fcRange: { min: 153, max: 163 }, sensation: 'Fuerte, solo palabras sueltas', rpe: 8 },
      { zone: 'Z5', percentRange: '93-100%', fcRange: { min: 163, max: 175 }, sensation: 'Máximo, no se puede hablar', rpe: 10 },
    ],
    fcMax: 175,
    hrZones: {
      z1: { min: 105, max: 123 },
      z2: { min: 123, max: 140 },
      z3: { min: 140, max: 153 },
      z4: { min: 153, max: 163 },
      z5: { min: 163, max: 175 },
    },
    createdAt: now,
    updatedAt: now,
  });
  console.log('Métricas del atleta creadas');

  // ─── 4. STRENGTH CIRCUITS ─────────────────────────────────────────

  const strengthCircuitsCol = db.collection('strengthcircuits');

  // Delete existing circuits for this plan
  await strengthCircuitsCol.deleteMany({ planId: planId });

  const circuits = [
    // ── Rutina 1 ──
    {
      circuitNumber: 1, name: 'Rutina 1 - Circuito 1', coachId: COACH_ID, planId,
      routineNumber: 1, timerFormat: "30''X15''X8",
      exercises: [
        { name: 'Sentadilla Bulgara', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Glute Ham Raise', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Step Up Frontal', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Escaladores Cruzados', timerWork: 30, timerRest: 15, timerRounds: 8 },
      ],
    },
    {
      circuitNumber: 2, name: 'Rutina 1 - Circuito 2', coachId: COACH_ID, planId,
      routineNumber: 1, timerFormat: "30''X15''X6",
      exercises: [
        { name: 'Estocada Diagonal c/Mancuerna', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Puente Gluteo c/peso', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Abdominales Bicicleta', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Laterales Mancuerna', timerWork: 30, timerRest: 15, timerRounds: 6 },
      ],
    },
    {
      circuitNumber: 3, name: 'Rutina 1 - Circuito 3', coachId: COACH_ID, planId,
      routineNumber: 1, timerFormat: "20''X10''X8",
      exercises: [
        { name: 'Gemelos en Maquina', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Tibiales', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Isquiotibiales', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Hip Thrust', timerWork: 20, timerRest: 10, timerRounds: 8 },
      ],
    },
    // ── Rutina 2 ──
    {
      circuitNumber: 1, name: 'Rutina 2 - Circuito 1', coachId: COACH_ID, planId,
      routineNumber: 2, timerFormat: "30''X15''X8",
      exercises: [
        { name: 'Sentadilla Sumo', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Estocada Lateral', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Swing c/Mancuerna', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Escaladores', timerWork: 30, timerRest: 15, timerRounds: 8 },
      ],
    },
    {
      circuitNumber: 2, name: 'Rutina 2 - Circuito 2', coachId: COACH_ID, planId,
      routineNumber: 2, timerFormat: "30''X15''X6",
      exercises: [
        { name: 'Subida Banco Lateral', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Puente Gluteo unilateral', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Plancha Lateral', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Superman', timerWork: 30, timerRest: 15, timerRounds: 6 },
      ],
    },
    {
      circuitNumber: 3, name: 'Rutina 2 - Circuito 3', coachId: COACH_ID, planId,
      routineNumber: 2, timerFormat: "20''X10''X8",
      exercises: [
        { name: 'Gemelos Unilateral', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Tibiales Banda Elastica', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Peso Muerto Unilateral', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Sentadilla Isometrica', timerWork: 20, timerRest: 10, timerRounds: 8 },
      ],
    },
    // ── Rutina 3 ──
    {
      circuitNumber: 1, name: 'Rutina 3 - Circuito 1', coachId: COACH_ID, planId,
      routineNumber: 3, timerFormat: "30''X15''X8",
      exercises: [
        { name: 'Sentadilla Goblet', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Step Up Lateral', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Swing Kettlebell', timerWork: 30, timerRest: 15, timerRounds: 8 },
        { name: 'Mountain Climbers', timerWork: 30, timerRest: 15, timerRounds: 8 },
      ],
    },
    {
      circuitNumber: 2, name: 'Rutina 3 - Circuito 2', coachId: COACH_ID, planId,
      routineNumber: 3, timerFormat: "30''X15''X6",
      exercises: [
        { name: 'Estocada Caminando', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Hip Thrust Unilateral', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Plancha con Toque Hombro', timerWork: 30, timerRest: 15, timerRounds: 6 },
        { name: 'Bird Dog', timerWork: 30, timerRest: 15, timerRounds: 6 },
      ],
    },
    {
      circuitNumber: 3, name: 'Rutina 3 - Circuito 3', coachId: COACH_ID, planId,
      routineNumber: 3, timerFormat: "20''X10''X8",
      exercises: [
        { name: 'Elevacion Gemelos', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Dorsiflexion Banda', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Curl Femoral', timerWork: 20, timerRest: 10, timerRounds: 8 },
        { name: 'Wall Sit', timerWork: 20, timerRest: 10, timerRounds: 8 },
      ],
    },
  ];

  const circuitDocs = circuits.map(c => ({
    ...c,
    createdAt: now,
    updatedAt: now,
  }));

  const circuitResult = await strengthCircuitsCol.insertMany(circuitDocs);
  const circuitIds = Object.values(circuitResult.insertedIds);
  console.log(`${circuitIds.length} circuitos de fuerza creados`);

  // Link strength circuits to the workout plan
  await workoutPlansCol.updateOne(
    { _id: planId },
    { $set: { strengthRoutines: circuitIds } },
  );
  console.log('Circuitos vinculados al plan');

  // ─── DONE ─────────────────────────────────────────────────────────

  console.log('\n✓ Seed completado para Ezequiel Manfredi');
  console.log('  - 1 plan de entrenamiento (4 semanas, 28 sesiones)');
  console.log('  - 4 carreras objetivo');
  console.log('  - Métricas del atleta con zonas de FC');
  console.log('  - 9 circuitos de fuerza (3 rutinas x 3 circuitos)');

  await mongoose.disconnect();
}

seedData().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});
