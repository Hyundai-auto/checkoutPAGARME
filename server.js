require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const PAGARME_API_KEY = process.env.PAGARME_API_KEY;
const PAGARME_BASE_URL = 'https://api.pagar.me/core/v5';

// Rota para criar o pedido Pix
app.post('/api/create-pix-order', async (req, res) => {
    try {
        const { name, cpf, phone, email, amount } = req.body;

        // Formata o valor para centavos (Pagar.me usa inteiros)
        const amountInCents = Math.round(parseFloat(amount) * 100);

        const payload = {
            customer: {
                name: name,
                email: email || 'cliente@exemplo.com',
                type: 'individual',
                document: cpf.replace(/\D/g, ''),
                phones: {
                    mobile_phone: {
                        country_code: '55',
                        area_code: phone.replace(/\D/g, '').substring(0, 2),
                        number: phone.replace(/\D/g, '').substring(2)
                    }
                }
            },
            items: [
                {
                    amount: amountInCents,
                    description: 'Pedido Checkout',
                    quantity: 1
                }
            ],
            payments: [
                {
                    payment_method: 'pix',
                    pix: {
                        expires_in: 3600 // 1 hora
                    }
                }
            ]
        };

        const response = await axios.post(`${PAGARME_BASE_URL}/orders`, payload, {
            auth: {
                username: PAGARME_API_KEY,
                password: ''
            }
        });

        const pixData = response.data.charges[0].last_transaction;
        
        res.json({
            success: true,
            qr_code: pixData.qr_code,
            qr_code_url: pixData.qr_code_url,
            expires_at: pixData.expires_at,
            order_id: response.data.id
        });

    } catch (error) {
        console.error('Erro ao criar pedido Pagar.me:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar QR Code Pix',
            error: error.response ? error.response.data : error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
