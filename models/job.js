"user strict"

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlJobFilter } = require("../helpers/sql");

class Job {

    /** Create a new job from data.
     * 
     * Data should include { title, salary, equity, companyHandle }
     * 
     * Returns { id, title, salary, equity, companyHandle }
     * 
     * Throws BadRequestError if given companyHandle is not found in the database.
     */
    static async create({ title, salary, equity, companyHandle }) {
        const handleCheck = await db.query(
            `SELECT handle FROM companies WHERE handle = $1`,
            [companyHandle]
        );

        if (!handleCheck.rows[0]) {
            throw new BadRequestError(`No company found with handle: ${companyHandle}`);
        }

        const result = await db.query(
            `INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );

        const job = result.rows[0];
        return job;
    }

    /**
     * Find all jobs.
     * 
     * Returns [{ id, title, salary, equtiy, companyHandle }, ...]
     */
    static async findAll() {
        const result = await db.query(
            `SELECT
                id, title, salary, equity,
                company_handle AS "companyHandle"
                FROM jobs`
        );
        return result.rows;
    }

    /** Filter jobs based on given query parameters.
    * 
    *  Query can include: {titleLike, minSalary, hasEquity}
    * 
    *  Returns [{ id, title, salary, equity, companyHandle }, ...]
    */
    static async filter(query) {
        const { filterString, valueList } = sqlJobFilter(query);

        const result = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
                 FROM jobs
                 WHERE ${filterString}`,
            valueList);
        return result.rows;
    }

    /** Given a job id, return data about the job.
     * 
     * Returns {id, title, salary, equity, companyHandle}
     * 
     * Throws NotFoundError if not found.
     */
    static async get(id) {
        const result = await db.query(
            `SELECT id, title, salary, equity,
            company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]);

        const job = result.rows[0];
        if (!job) throw new NotFoundError(`No job found with ID ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data, {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                            SET ${setCols}
                            WHERE id = ${idVarIdx}
                            RETURNING id, title, salary, equity,
                            company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);

        const job = result.rows[0];
        if (!job) throw new NotFoundError(`No job found with ID ${id}`);

        return job;
    }

    /** Delete job from database given its id; returns undefined.
    *
    * Throws NotFoundError if not found.
    **/
    static async remove(id) {
        const result = await db.query(
            `DELETE
                FROM jobs
                WHERE id = $1
                RETURNING id`,
            [id]
        );

        const job = result.rows[0];
        if (!job) throw new NotFoundError(`No job found with ID ${id}`);
    }
}


module.exports = Job;
