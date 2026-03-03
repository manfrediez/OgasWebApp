import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

async function seed() {
  const conn = await mongoose.connect('mongodb://localhost:27017/pitu-app');
  const db = conn.connection.db!;
  const usersCollection = db.collection('users');

  const password = await bcrypt.hash('123456', 10);
  const now = new Date();

  // Coach: Hernan Ogas
  const existingCoach = await usersCollection.findOne({ email: 'hernan@ogas.com' });
  let coachId: mongoose.Types.ObjectId;

  if (existingCoach) {
    coachId = existingCoach._id as mongoose.Types.ObjectId;
    console.log('Coach ya existe:', coachId.toString());
  } else {
    const coachResult = await usersCollection.insertOne({
      email: 'hernan@ogas.com',
      password,
      firstName: 'Hernan',
      lastName: 'Ogas',
      role: 'COACH',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    coachId = coachResult.insertedId as unknown as mongoose.Types.ObjectId;
    console.log('Coach creado:', coachId.toString());
  }

  // Athlete: Ezequiel Manfredi
  const existingAthlete = await usersCollection.findOne({ email: 'ezequiel@manfredi.com' });

  if (existingAthlete) {
    console.log('Atleta ya existe:', existingAthlete._id.toString());
  } else {
    const athleteResult = await usersCollection.insertOne({
      email: 'ezequiel@manfredi.com',
      password,
      firstName: 'Ezequiel',
      lastName: 'Manfredi',
      role: 'ATHLETE',
      coachId: coachId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('Atleta creado:', athleteResult.insertedId.toString());
  }

  // Athlete: Fernando Andres
  const existingFernando = await usersCollection.findOne({ email: 'fernando@andres.com' });

  if (existingFernando) {
    console.log('Atleta Fernando ya existe:', existingFernando._id.toString());
  } else {
    const fernandoResult = await usersCollection.insertOne({
      email: 'fernando@andres.com',
      password,
      firstName: 'Fernando',
      lastName: 'Andres',
      role: 'ATHLETE',
      coachId: coachId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('Atleta Fernando creado:', fernandoResult.insertedId.toString());
  }

  // Athlete: Matias Muñoz
  const existingMatias = await usersCollection.findOne({ email: 'matias@munoz.com' });

  if (existingMatias) {
    console.log('Atleta Matias ya existe:', existingMatias._id.toString());
  } else {
    const matiasResult = await usersCollection.insertOne({
      email: 'matias@munoz.com',
      password,
      firstName: 'Matias',
      lastName: 'Muñoz',
      role: 'ATHLETE',
      coachId: coachId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('Atleta Matias creado:', matiasResult.insertedId.toString());
  }

  console.log('\n--- Credenciales ---');
  console.log('Coach:   hernan@ogas.com / 123456');
  console.log('Atleta:  ezequiel@manfredi.com / 123456');
  console.log('Atleta:  fernando@andres.com / 123456');
  console.log('Atleta:  matias@munoz.com / 123456');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
