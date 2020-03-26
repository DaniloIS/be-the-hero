const connection = require('../database/connection');
module.exports = {
    async index(request, response) {
        const { page = 1 } = request.query;

        const [count] = await connection('incidents').count();

        const incidents = await connection('incidents')
            // Busca na tabela ongs dados relacionados ao ong_id da tabela incidents
            .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
            .limit(5)
            .offset((page - 1) * 5)
            .select([
                'incidents.*',
                'ongs.name',
                'ongs.email',
                'ongs.whatsapp',
                'ongs.city',
                'ongs.uf'
             ]);

        response.header('X-Total-Count', count['count(*)']);

        return response.json(incidents);
    },

    async create(request, response) {
        const { title, description, value } = request.body;
        const ong_id = request.headers.authorization;

        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id,
        });
        return response.json({ id });
    },

    async delete(request, response) {
        const { id } = request.params;
        const ong_id = request.headers.authorization;

        // Buscar um incidente onde o id é igual ao id e selecionar a coluna ong_id
        const incident = await connection('incidents')
            .where('id', id)
            .select('ong_id')
            .first();
        
        // Verifica se o ong_id é igual ao da ong logada
        if (incident.ong_id != ong_id){
            return response.status(401).json({ error: 'Operation not permitted.' });
        }
        
        // Delete registro na tabela do banco de dados
        await connection('incidents').where('id', id).delete();

        return response.status(204).send();
    }
};
