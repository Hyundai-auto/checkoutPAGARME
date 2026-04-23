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

app.post('/api/create-pix-order', async (req, res) => {
    try {
        const { name, cpf, phone, email, amount } = req.body;
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
                    payment_method: 'checkout',
                    checkout: {
                        expires_in: 3600,
                        billing_address_editable: false,
                        customer_editable: false,
                        accepted_payment_methods: ['pix'],
                        pix: {
                            expires_in: 3600
                        }
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

        const checkoutUrl = response.data.checkouts[0].payment_url;
        
        res.json({
            success: true,
            checkout_url: checkoutUrl,
            order_id: response.data.id
        });

    } catch (error) {
        console.error('Erro ao criar checkout Pagar.me:', error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar checkout de pagamento',
            error: error.response ? error.response.data : error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
