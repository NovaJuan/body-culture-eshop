import pg from 'pg';

async function MakeQuery(query,conditionals = []){
    const config = process.env.DATABASE_URL ? {
        connectionString:process.env.DATABASE_URL
    } : {
        host:process.env.PG_HOST,
        user:process.env.PG_USER,
        password:process.env.PG_PASSWORD,
        port:process.env.PG_PORT,
        database:process.env.PG_DATABASE,
        max: 20,
        idleTimeoutMillis: 20000,
        connectionTimeoutMillis: 10000
    };
    
    const pool = new pg.Pool(config);
    
    try {
        const client = await pool.connect();
        const results = await client.query(query,conditionals);
        client.release();

        return results.rows;
    } catch (err) {
        console.log(err)
    }
}

export default MakeQuery;