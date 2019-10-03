const express = require('express');
const app = express();
const paypal = require('paypal-rest-sdk');
const formidable = require('express-formidable');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'Af7Wp5srpIcu9nSoQd869s_OzWDoltOK_G1M78TWrKtyOl22sGH2JkaGoY-p6qoHEkKQ3e4uaY-BW7oh',
    'client_secret': 'EEPp6JtgPw-xGkKRs1cySaJfplPvK6q5NMw07eYqsPMkWxsL9RJGjG1-JYrbEw6dpZvnKmQNJNO4Ylyl'
  });

app.set('views', 'views');           // In which directory are views located
app.set('view engine', 'ejs');       // Which view engine to use
app.use(express.static('./public')); // Where are static files located

app.use(formidable({
    multiples: true
}));				//parsing form data  

app.get('/', (req, res) => res.render('index'));

app.get('/betingelser', (req, res) => res.render('conditions'));

app.get('/persondata', (req, res) => res.render('data'));

app.get('/cookies', (req, res) => res.render('cookie'));

app.get('/bestilling', (req, res) => res.render('order'));

app.post('/bestilling', (req, res) => {
   
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:5000/success",
            "cancel_url": "http://localhost:5000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": req.fields.event,
                    "sku": "001",
                    "price": req.fields.price/req.fields.tickets,
                    "currency": "DKK",
                    "quantity": req.fields.tickets
                }]
            },
            "amount": {
                "currency": "DKK",
                "total": req.fields.price
            },
            "description": `Billetter til: ${req.fields.event}`
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for(let i = 0;i < payment.links.length;i++) {
                if(payment.links[i].rel === 'approval_url'){
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });
});

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        // "transactions": [{
        //     "amount": {
        //         "currency": "DKK",
        //         "total": "600"
        //     }
        // }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;            
        } else {
            console.info(payment); // Svaret du får tilbage
            res.render('success', { 'payment': payment, 'payer': payment.payer.payer_info, 'trans': payment.transactions[0].amount, 'descrip': payment.transactions[0]})
        }
    })
});

app.get('/cancel', (req, res) => res.send('Cancelled'))

app.listen(5000, () => console.log('Server started'));