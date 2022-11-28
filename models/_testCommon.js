const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  await db.query("DELETE FROM jobs");
  await db.query("DELETE FROM applications");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]);

  await db.query(`
      INSERT INTO jobs (title, salary, equity, company_handle)
      VALUES  ('Job 1', 10000, 0.1, 'c1'),
              ('Job 2', 20000, 0.2, 'c2'),
              ('Job 3', 30000, 0.3, 'c3'),
              ('Job 4', 40000, 0,   'c2')`);


  // get job ids, so that we know they are current
  let res = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
  const jobId1 = res.rows[0].id;

  res = await db.query(`SELECT id FROM jobs WHERE title = 'Job 2'`);
  const jobId2 = res.rows[0].id;

  // add sample job applications
  await db.query(`
      INSERT INTO applications (username, job_id)
      VALUES ('u1', $1),
             ('u1', $2)`,
    [jobId1, jobId2]);

}
async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};