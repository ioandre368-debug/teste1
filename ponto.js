import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
    const filename = 'pontos_i3o.json';

    try {
        // --- LOGIN ---
        if (req.method === 'POST' && req.url.includes('login')) {
            const { user, pass } = req.body;
            const usuarios = {
                "123": { nome: "DIRETOR GERAL", role: "ADMIN", pass: "123" },
                "carlos": { nome: "CARLOS SILVA", role: "USER", pass: "123" },
                "andre": { nome: "ANDRÉ SILVA", role: "USER", pass: "123" }
            };
            if (usuarios[user] && usuarios[user].pass === pass) {
                return res.status(200).json(usuarios[user]);
            }
            return res.status(401).json({ message: "Acesso Negado" });
        }

        // --- REGISTAR PONTO ---
        if (req.method === 'POST' && req.url.includes('ponto')) {
            const novoPonto = req.body;
            let historico = [];
            const { blobs } = await list();
            const myBlob = blobs.find(b => b.pathname === filename);

            if (myBlob) {
                const response = await fetch(myBlob.url, {
                    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
                });
                historico = await response.json();
            }

            historico.push({
                ...novoPonto,
                ts: Date.now()
            });

            await put(filename, JSON.stringify(historico), {
                access: 'private',
                addRandomSuffix: false,
            });
            return res.status(200).json({ success: true });
        }

        // --- LISTAR (ADMIN) ---
        if (req.method === 'GET') {
            const { blobs } = await list();
            const myBlob = blobs.find(b => b.pathname === filename);
            if (!myBlob) return res.json([]);

            const response = await fetch(myBlob.url, {
                headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
            });
            return res.json(await response.json());
        }

        // --- LIMPAR TUDO ---
        if (req.method === 'DELETE') {
            const { blobs } = await list();
            const myBlob = blobs.find(b => b.pathname === filename);
            if (myBlob) await del(myBlob.url);
            return res.json({ success: true });
        }

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}