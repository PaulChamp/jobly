"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    a1Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /companies */

describe("POST /companies", function () {
    const newJob = {
        title: "My New Job",
        salary: 150000,
        equity: 0.15,
        companyHandle: "c1",
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(201);

        newJob.equity = newJob.equity.toString();

        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                ...newJob
            },
        });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({})
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with extra data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                foo: "extra data",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon with no filters", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: "Job 1",
                        salary: 10000,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                    {
                        id: expect.any(Number),
                        title: "Job 2",
                        salary: 20000,
                        equity: "0.2",
                        companyHandle: "c3"
                    },
                    {
                        id: expect.any(Number),
                        title: "Job 3",
                        salary: 30000,
                        equity: "0.3",
                        companyHandle: "c3"
                    }
                ],
        });
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
        const jobId1 = result.rows[0].id;

        const resp = await request(app).get(`/jobs/${jobId1}`);
        expect(resp.body).toEqual({
            job: {
                id: jobId1,
                title: "Job 1",
                salary: 10000,
                equity: "0.1",
                companyHandle: "c1"
            }
        });
    });

    test("not found for no such job id", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});


/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
        const jobId1 = result.rows[0].id;

        const resp = await request(app)
            .patch(`/jobs/${jobId1}`)
            .send({
                title: "Updated Job Title",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({
            job: {
                id: jobId1,
                title: "Updated Job Title",
                salary: 10000,
                equity: "0.1",
                companyHandle: "c1"
            }
        });
    });

    test("unauth for non-admin", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
        const jobId1 = result.rows[0].id;

        const resp = await request(app)
            .patch(`/jobs/${jobId1}`)
            .send({
                title: "Updated Job Title",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
        const jobId1 = result.rows[0].id;

        const resp = await request(app)
            .patch(`/jobs/${jobId1}`)
            .send({
                title: "Updated Job Title",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job id", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "Updated Job Title",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on invalid data", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
        const jobId1 = result.rows[0].id;

        const resp = await request(app)
            .patch(`/jobs/${jobId1}`)
            .send({
                foo: "Extra Data Not Allowed",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});


/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
        const jobId1 = result.rows[0].id;

        const resp = await request(app)
            .delete(`/jobs/${jobId1}`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({ deleted: jobId1 });
    });

    test("unauth for non-admin", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
        const jobId1 = result.rows[0].id;

        const resp = await request(app)
            .delete(`/jobs/${jobId1}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'Job 1'`);
        const jobId1 = result.rows[0].id;

        const resp = await request(app)
            .delete(`/jobs/${jobId1}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});