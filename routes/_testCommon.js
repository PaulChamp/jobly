"use strict";

const db = require("../db.js");
const Company = require("../models/company");
const User = require("../models/user");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await db.query("DELETE FROM jobs");

  // Create some companies
  await Company.create(
    {
      handle: "c1",
      name: "C1",
      numEmployees: 1,
      description: "Desc1",
      logoUrl: "http://c1.img",
    });
  await Company.create(
    {
      handle: "c2",
      name: "C2",
      numEmployees: 2,
      description: "Desc2",
      logoUrl: "http://c2.img",
    });
  await Company.create(
    {
      handle: "c3",
      name: "C3",
      numEmployees: 3,
      description: "Desc3",
      logoUrl: "http://c3.img",
    });

  // Create some users
  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  await User.register({
    username: "a1",
    firstName: "A1F",
    lastName: "A1L",
    email: "admin1@user.com",
    password: "password1",
    isAdmin: true,
  });

  // Create some jobs
  await Job.create({
    title: "Job 1",
    salary: 10000,
    equity: 0.1,
    companyHandle: "c1"
  });
  await Job.create({
    title: "Job 2",
    salary: 20000,
    equity: 0.2,
    companyHandle: "c3"
  });
  await Job.create({
    title: "Job 3",
    salary: 30000,
    equity: 0.3,
    companyHandle: "c3"
  });

  // Create some applications
  // get job ids, so that we know they are current
  let res = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
  const jobId1 = res.rows[0].id;

  res = await db.query(`SELECT id FROM jobs WHERE title = 'Job 2'`);
  const jobId2 = res.rows[0].id;

  // add sample job applications
  await User.apply('u1', jobId1);
  await User.apply('u1', jobId2);


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


const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
const a1Token = createToken({ username: "a1", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  a1Token,
};
