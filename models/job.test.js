"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "New Job",
        salary: 87654,
        equity: 0.32,
        companyHandle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newJob);

        expect(job.id).toEqual(expect.any(Number));
        delete job.id;

        job.equity = +job.equity;
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT
                title, salary, equity, company_handle AS "companyHandle"
                FROM jobs
                WHERE salary = '87654'`
        );
        expect(result.rows).toEqual([
            {
                title: "New Job",
                salary: 87654,
                equity: "0.32",
                companyHandle: "c1"
            }
        ]);
    });

    test("bad request for invalid company handle", async function () {
        try {
            newJob.companyHandle = "oops"
            await Job.create(newJob);
            fail();
        } catch (err) {
            console.log(err);
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

});

/************************************** findAll */

describe("findAll", function () {

    test("works", async function () {
        let jobs = await Job.findAll();

        expect(jobs).toEqual([
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
                companyHandle: "c2"
            },
            {
                id: expect.any(Number),
                title: "Job 3",
                salary: 30000,
                equity: "0.3",
                companyHandle: "c3"
            },
            {
                id: expect.any(Number),
                title: "Job 4",
                salary: 40000,
                equity: "0",
                companyHandle: "c2"
            }
        ]);
    });
})

/************************************** filter */

describe("filter", function () {
    test("verify titleLike filtering", async function () {
        let jobs = await Job.filter(
            { titleLike: 'Job 1' }
        );
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Job 1",
                salary: 10000,
                equity: "0.1",
                companyHandle: 'c1'
            }
        ]);

        jobs = await Job.filter(
            { titleLike: 'job 1' }
        );
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Job 1",
                salary: 10000,
                equity: "0.1",
                companyHandle: 'c1'
            }
        ]);

        jobs = await Job.filter(
            { titleLike: '1' }
        );
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Job 1",
                salary: 10000,
                equity: "0.1",
                companyHandle: 'c1'
            }
        ]);
    });

    test("verify minSalary filter", async function () {
        let jobs = await Job.filter(
            { minSalary: 30000 }
        );
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Job 3",
                salary: 30000,
                equity: "0.3",
                companyHandle: 'c3'
            },
            {
                id: expect.any(Number),
                title: "Job 4",
                salary: 40000,
                equity: "0",
                companyHandle: 'c2'
            }
        ]);

        jobs = await Job.filter(
            { minSalary: 50000 }
        );
        expect(jobs).toEqual([]);
    });

    test("verify hasEquity filter", async function () {
        let jobs = await Job.filter(
            { hasEquity: true }
        );
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Job 1",
                salary: 10000,
                equity: "0.1",
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: "Job 2",
                salary: 20000,
                equity: "0.2",
                companyHandle: 'c2'
            },
            {
                id: expect.any(Number),
                title: "Job 3",
                salary: 30000,
                equity: "0.3",
                companyHandle: 'c3'
            }
        ]);
    });

    test("verify combined filters", async function () {
        let jobs = await Job.filter(
            {
                minSalary: 25000,
                hasEquity: true
            }
        );
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "Job 3",
                salary: 30000,
                equity: "0.3",
                companyHandle: 'c3'
            }
        ]);
    })
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let newJob = {
            title: "New Job",
            salary: 87654,
            equity: 0.32,
            companyHandle: "c1"
        };
        newJob = await Job.create(newJob);
        let testJob = await Job.get(newJob.id);
        expect(testJob).toEqual(newJob);
    });

    test("not found if no such job id", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "New Title",
        salary: 99999,
        equity: 0.99,
    };

    test("works", async function () {
        let result = await db.query(
            `INSERT INTO jobs
                    (title, salary, equity, company_handle)
                    VALUES
                    ('New Job', 11111, 0.11, 'c1')
                    RETURNING id`);
        const newJob = result.rows[0];

        let job = await Job.update(newJob.id, updateData);
        job.equity = +job.equity;

        expect(job).toEqual({
            id: newJob.id,
            companyHandle: 'c1',
            ...updateData
        });
    });

    test("works: partial update", async function () {
        let result = await db.query(
            `INSERT INTO jobs
                    (title, salary, equity, company_handle)
                    VALUES
                    ('New Job', 11111, 0.11, 'c1')
                    RETURNING id`);
        const newJob = result.rows[0];

        let job = await Job.update(newJob.id, { title: "Updated Title" });
        job.equity = +job.equity;

        expect(job).toEqual({
            id: newJob.id,
            title: "Updated Title",
            salary: 11111,
            equity: 0.11,
            companyHandle: 'c1',
        });
    });

    test("works: null fields", async function () {
        let result = await db.query(
            `INSERT INTO jobs
                    (title, salary, equity, company_handle)
                    VALUES
                    ('New Job', 11111, 0.11, 'c1')
                    RETURNING id`);
        const newJob = result.rows[0];

        // null out some data in the update
        updateData.salary = null;
        updateData.equity = null;

        let job = await Job.update(newJob.id, updateData);
        job.equity = +job.equity;

        expect(job).toEqual({
            id: newJob.id,
            title: "New Title",
            salary: null,
            equity: 0,
            companyHandle: 'c1',
        });
    });

    test("not found if no such job id", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        let result = await db.query(
            `INSERT INTO jobs
                    (title, salary, equity, company_handle)
                    VALUES
                    ('New Job', 11111, 0.11, 'c1')
                    RETURNING id`);
        const newJob = result.rows[0];

        try {
            await Job.update(newJob.id, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */
describe("remove", function () {
    test("works", async function () {
        let result = await db.query(
            `INSERT INTO jobs
                    (title, company_handle)
                    VALUES
                    ('New Job', 'c1')
                    RETURNING id`);
        const newJob = result.rows[0];

        await Job.remove(newJob.id);

        result = await db.query(
            `SELECT * FROM jobs WHERE id = ${newJob.id}`
        );
        expect(0).toEqual(0);
        expect(result.rows.length).toEqual(0);
    });

    test("not found if no such job id", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
