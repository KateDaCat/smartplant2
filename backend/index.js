const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'sarawak_plant_db',
  port: process.env.DB_PORT || 3306,
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

app.get('/', (req, res) => res.send('Sarawak Plant Backend OK'));

/* ------------------ ROLES ------------------ */
app.get('/roles', async (req, res) => {
  try {
    const rows = await runQuery('SELECT * FROM Roles ORDER BY role_id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching roles');
  }
});

app.post('/roles', async (req, res) => {
  const { role_name, description } = req.body;
  try {
    const result = await runQuery(
      'INSERT INTO Roles (role_name, description) VALUES (?, ?)',
      [role_name, description],
    );
    res.json({ message: 'Role created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating role');
  }
});

app.delete('/roles/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM Roles WHERE role_id = ?', [req.params.id]);
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting role');
  }
});

/* ------------------ USERS ------------------ */
app.get('/users', async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT 
         user_id,
         username,
         email,
         role_id,
         avatar_url,
         phone,
         is_active,
         created_at
       FROM Users
       ORDER BY user_id`,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching users');
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT 
         user_id,
         username,
         email,
         role_id,
         avatar_url,
         phone,
         is_active,
         created_at
       FROM Users
       WHERE user_id = ?`,
      [req.params.id],
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching user');
  }
});

app.post('/users', async (req, res) => {
  const { username, email, password_hash, role_id, avatar_url } = req.body;
  try {
    const result = await runQuery(
      'INSERT INTO Users (username, email, password_hash, role_id, avatar_url) VALUES (?, ?, ?, ?, ?)',
      [username, email, password_hash, role_id, avatar_url],
    );
    res.json({ message: 'User created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});

app.put('/users/:id', async (req, res) => {
  const { username, email, role_id, avatar_url, phone, is_active } = req.body;

  console.log('PUT /users/:id body =', req.body);

  try {
    const result = await runQuery(
      `UPDATE Users
       SET username = ?, email = ?, role_id = ?, avatar_url = ?, phone = ?, is_active = ?
       WHERE user_id = ?`,
      [
        username,
        email,
        role_id,
        avatar_url,
        phone ?? null,
        typeof is_active === 'undefined' ? 1 : is_active ? 1 : 0,
        req.params.id,
      ],
    );

    console.log('Updated user rows =', result.affectedRows);
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send('Error updating user');
  }
});


app.delete('/users/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM Users WHERE user_id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting user');
  }
});

/* ------------------ SPECIES ------------------ */
app.get('/species', async (req, res) => {
  try {
    const rows = await runQuery('SELECT * FROM Species ORDER BY species_id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching species');
  }
});

app.get('/species/:id', async (req, res) => {
  try {
    const rows = await runQuery('SELECT * FROM Species WHERE species_id = ?', [
      req.params.id,
    ]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching species');
  }
});

app.post('/species', async (req, res) => {
  const { scientific_name, common_name, is_endangered, description, image_url } =
    req.body;
  try {
    const result = await runQuery(
      'INSERT INTO Species (scientific_name, common_name, is_endangered, description, image_url) VALUES (?, ?, ?, ?, ?)',
      [
        scientific_name,
        common_name,
        is_endangered ? 1 : 0,
        description,
        image_url,
      ],
    );
    res.json({ message: 'Species created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating species');
  }
});

app.put('/species/:id', async (req, res) => {
  const { scientific_name, common_name, is_endangered, description, image_url } =
    req.body;
  try {
    await runQuery(
      'UPDATE Species SET scientific_name=?, common_name=?, is_endangered=?, description=?, image_url=? WHERE species_id=?',
      [
        scientific_name,
        common_name,
        is_endangered ? 1 : 0,
        description,
        image_url,
        req.params.id,
      ],
    );
    res.json({ message: 'Species updated' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating species');
  }
});

app.delete('/species/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM Species WHERE species_id = ?', [req.params.id]);
    res.json({ message: 'Species deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting species');
  }
});

/* ------------------ PLANT OBSERVATIONS ------------------ */
app.get('/admin/heatmap', async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT
         po.observation_id,
         po.user_id,
         po.species_id,
         po.location_name,
         po.location_latitude,
         po.location_longitude,
         po.is_masked,
         po.status,
         po.created_at,
         s.common_name,
         s.scientific_name,
         s.is_endangered,
         ai.confidence_score
       FROM Plant_Observations po
       LEFT JOIN Species s ON s.species_id = po.species_id
       LEFT JOIN (
         SELECT observation_id, MAX(confidence_score) AS confidence_score
         FROM AI_Results
         GROUP BY observation_id
       ) ai ON ai.observation_id = po.observation_id
       ORDER BY po.created_at DESC`
    );

    const payload = rows.map((row) => ({
      observation_id: row.observation_id,
      user_id: row.user_id,
      species: {
        species_id: row.species_id,
        common_name: row.common_name || 'Unknown species',
        scientific_name: row.scientific_name || 'Unknown scientific name',
        is_endangered: row.is_endangered === 1,
      },
      location_name: row.location_name || 'Unknown location',
      location_latitude: row.location_latitude,
      location_longitude: row.location_longitude,
      confidence_score:
        typeof row.confidence_score === 'number'
          ? Number(row.confidence_score)
          : null,
      is_masked: row.is_masked === 1,
      status: row.status,
      created_at: row.created_at,
    }));

    res.json(payload);
  } catch (err) {
    console.error('Error fetching heatmap data:', err);
    res.status(500).send('Error fetching heatmap data');
  }
});

app.get('/plant-observations', async (req, res) => {
  try {
    const rows = await runQuery(
      'SELECT * FROM Plant_Observations ORDER BY created_at DESC',
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching observations');
  }
});

app.get('/plant-observations/:id', async (req, res) => {
  try {
    const rows = await runQuery(
      'SELECT * FROM Plant_Observations WHERE observation_id = ?',
      [req.params.id],
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching observation');
  }
});

app.post('/plant-observations', async (req, res) => {
  const {
    user_id,
    species_id,
    photo_url,
    location_latitude,
    location_longitude,
    location_name,
    notes,
    source,
    status,
  } = req.body;
  try {
    const result = await runQuery(
      `INSERT INTO Plant_Observations (user_id, species_id, photo_url, location_latitude, location_longitude, location_name, notes, source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        species_id,
        photo_url,
        location_latitude,
        location_longitude,
        location_name,
        notes,
        source || 'camera',
        status || 'pending',
      ],
    );
    res.json({ message: 'Observation created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating observation');
  }
});

app.put('/plant-observations/:id', async (req, res) => {
  const {
    species_id,
    photo_url,
    location_latitude,
    location_longitude,
    location_name,
    notes,
    source,
    status,
    is_masked,
  } = req.body;

  const updates = [
    'species_id = ?',
    'photo_url = ?',
    'location_latitude = ?',
    'location_longitude = ?',
    'location_name = ?',
    'notes = ?',
    'source = ?',
    'status = ?',
  ];

  const params = [
    species_id ?? null,
    photo_url ?? null,
    location_latitude ?? null,
    location_longitude ?? null,
    location_name ?? null,
    notes ?? null,
    source ?? null,
    status ?? null,
  ];

  if (typeof is_masked !== 'undefined') {
    updates.push('is_masked = ?');
    params.push(is_masked ? 1 : 0);
  }

  params.push(req.params.id);

  try {
    await runQuery(
      `UPDATE Plant_Observations SET ${updates.join(', ')} WHERE observation_id = ?`,
      params,
    );
    res.json({ message: 'Observation updated' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating observation');
  }
});

app.patch('/plant-observations/:id/mask', async (req, res) => {
  const { is_masked } = req.body;
  if (typeof is_masked === 'undefined') {
    return res.status(400).send('Field "is_masked" is required.');
  }

  try {
    await runQuery(
      'UPDATE Plant_Observations SET is_masked = ? WHERE observation_id = ?',
      [is_masked ? 1 : 0, req.params.id],
    );
    res.json({ message: 'Observation visibility updated', is_masked: !!is_masked });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating observation visibility');
  }
});

app.delete('/plant-observations/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM Plant_Observations WHERE observation_id = ?', [
      req.params.id,
    ]);
    res.json({ message: 'Observation deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting observation');
  }
});

/* ------------------ SENSOR DEVICES ------------------ */
app.get('/sensor-devices', async (req, res) => {
  try {
    const rows = await runQuery(
      'SELECT * FROM Sensor_Devices ORDER BY device_id',
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching devices');
  }
});

app.post('/sensor-devices', async (req, res) => {
  const {
    node_id,
    device_name,
    species_id,
    location_latitude,
    location_longitude,
    is_active,
  } = req.body;
  try {
    const result = await runQuery(
      'INSERT INTO Sensor_Devices (node_id, device_name, species_id, location_latitude, location_longitude, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [
        node_id,
        device_name,
        species_id,
        location_latitude,
        location_longitude,
        is_active ? 1 : 0,
      ],
    );
    res.json({ message: 'Device created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating device');
  }
});

app.put('/sensor-devices/:id', async (req, res) => {
  const {
    node_id,
    device_name,
    species_id,
    location_latitude,
    location_longitude,
    is_active,
  } = req.body;
  try {
    await runQuery(
      'UPDATE Sensor_Devices SET node_id=?, device_name=?, species_id=?, location_latitude=?, location_longitude=?, is_active=? WHERE device_id=?',
      [
        node_id,
        device_name,
        species_id,
        location_latitude,
        location_longitude,
        is_active ? 1 : 0,
        req.params.id,
      ],
    );
    res.json({ message: 'Device updated' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating device');
  }
});

app.delete('/sensor-devices/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM Sensor_Devices WHERE device_id = ?', [
      req.params.id,
    ]);
    res.json({ message: 'Device deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting device');
  }
});

/* ------------------ AI RESULTS ------------------ */
app.get('/ai-results', async (req, res) => {
  try {
    const rows = await runQuery(
      'SELECT * FROM AI_Results ORDER BY created_at DESC',
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching AI results');
  }
});

app.post('/ai-results', async (req, res) => {
  const { observation_id, species_id, confidence_score, rank } = req.body;
  try {
    const result = await runQuery(
      'INSERT INTO AI_Results (observation_id, species_id, confidence_score, rank) VALUES (?, ?, ?, ?)',
      [observation_id, species_id, confidence_score, rank],
    );
    res.json({ message: 'AI result stored', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating AI result');
  }
});

app.delete('/ai-results/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM AI_Results WHERE ai_result_id = ?', [
      req.params.id,
    ]);
    res.json({ message: 'AI result deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting AI result');
  }
});

/* ------------------ SENSOR READINGS ------------------ */
app.get('/sensor-readings', async (req, res) => {
  try {
    const rows = await runQuery(
      'SELECT * FROM Sensor_Readings ORDER BY reading_timestamp DESC',
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching readings');
  }
});

app.get('/sensor-readings/device/:device_id', async (req, res) => {
  try {
    const rows = await runQuery(
      'SELECT * FROM Sensor_Readings WHERE device_id = ? ORDER BY reading_timestamp DESC',
      [req.params.device_id],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching readings');
  }
});

app.post('/sensor-data', async (req, res) => {
  const {
    device_id,
    temperature,
    humidity,
    soil_moisture,
    motion_detected,
    reading_status,
    location_latitude,
    location_longitude,
  } = req.body;
  try {
    const result = await runQuery(
      `INSERT INTO Sensor_Readings (device_id, temperature, humidity, soil_moisture, motion_detected, reading_status, location_latitude, location_longitude, alert_generated, reading_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [
        device_id,
        temperature,
        humidity,
        soil_moisture,
        motion_detected ? 1 : 0,
        reading_status || 'ok',
        location_latitude,
        location_longitude,
      ],
    );
    res.json({ message: 'Sensor reading stored', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error inserting sensor reading');
  }
});

app.delete('/sensor-readings/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM Sensor_Readings WHERE reading_id = ?', [
      req.params.id,
    ]);
    res.json({ message: 'Reading deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting reading');
  }
});

/* ------------------ ALERTS ------------------ */
app.get('/alerts', async (req, res) => {
  try {
    const rows = await runQuery('SELECT * FROM Alerts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching alerts');
  }
});

app.post('/alerts', async (req, res) => {
  const { device_id, reading_id, alert_type, alert_message, severity } = req.body;
  try {
    const result = await runQuery(
      'INSERT INTO Alerts (device_id, reading_id, alert_type, alert_message, severity) VALUES (?, ?, ?, ?, ?)',
      [device_id, reading_id, alert_type, alert_message, severity || 'medium'],
    );
    res.json({ message: 'Alert created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating alert');
  }
});

app.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    await runQuery(
      'UPDATE Alerts SET is_resolved = 1, resolved_at = NOW() WHERE alert_id = ?',
      [req.params.id],
    );
    res.json({ message: 'Alert resolved' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error resolving alert');
  }
});

app.delete('/alerts/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM Alerts WHERE alert_id = ?', [req.params.id]);
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting alert');
  }
});

/* ------------------ DASHBOARD STATS ------------------ */
app.get('/dashboard/stats', async (req, res) => {
  try {
    const totals = await Promise.all([
      runQuery('SELECT COUNT(*) AS count FROM Species'),
      runQuery('SELECT COUNT(*) AS count FROM Plant_Observations'),
      runQuery('SELECT COUNT(*) AS count FROM Sensor_Devices WHERE is_active = 1'),
      runQuery('SELECT COUNT(*) AS count FROM Alerts WHERE is_resolved = 0'),
      runQuery('SELECT COUNT(*) AS count FROM Sensor_Readings'),
    ]);

    res.json({
      totalSpecies: totals[0][0].count,
      totalObservations: totals[1][0].count,
      activeDevices: totals[2][0].count,
      unresolvedAlerts: totals[3][0].count,
      totalReadings: totals[4][0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching dashboard stats');
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://127.0.0.1:${PORT}`);
});

module.exports = { app, runQuery };
