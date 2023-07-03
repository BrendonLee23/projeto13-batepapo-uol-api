import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';
import Joi from 'joi';

dotenv.config();

const app = express ();
app.use(cors());
app.use(json());

const participantSchema = Joi.object({

    name: Joi.string().required()

});

const messageSchema = Joi.object({

    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().valid('message', 'private_message')

});

function filterUsersMessages (message, participant) {

    const publicMessage = type === 'message';

    if ((message.to === 'Todos') || (message.from === participant) || (message.to === participant) || (publicMessage)) {
        return true;
    } else {
        return false;
    }

}

app.post('/participants', async (req, res) => {

    const participant = req.body;
    const isValidParticipant = participantSchema.validate(participant);
    
    if (isValidParticipant.error) {

        return res.sendStatus(422);
        
    }

    try {

        const mongoClient = new MongoClient(process.env.MONGO_URI);
        await mongoClient.connect();

        const participantsCollection = mongoClient.db('bate-papo-uol-chat').collection('participants');
        const messagesCollection = mongoClient.db('bate-papo-uol-chat').collection('messages');

        
        const participantNameInUse = await participantsCollection.findOne({ name: participant.name });


        if (participantNameInUse) {

            return res.sendStatus(409);
        
        }

        await participantsCollection.insertOne({

            ...participant,
            lastStatus: Date.now()

        });

        await messagesCollection.insertOne({

            from: participant.name,
            to: 'Todos',
            text: 'Entra na sala...',
            type: 'status',
            time: dayjs().format('HH:mm:ss')

        }); 

        await mongoClient.close();
        res.sendStatus(201);
        console.log('Participants POST => OK!');

    } catch (e) {

        console.log('Participants POST => Erro!!!!!!!!');
        res.sendStatus(500);

    }

});

app.get('/participants', async (req, res) => {

    try {

        const mongoClient = new MongoClient(process.env.MONGO_URI);
        await mongoClient.connect();

        const participantsCollection = mongoClient.db('bate-papo-uol-chat').collection('participants');
        const participants = await participantsCollection.find({}).toArray();

        await mongoClient.close();
        console.log('Participants GET => OK!');
        res.send(participants);

    } catch (e) {

        console.log('Participants GET => ERROR!!!!!!!!');
        res.sendStatus(500, e);

    }

});

app.post('/messages', async (req, res) => {

    const message = req.body;
    const from = req.headers;

    const isValidMessage = messageSchema.validate(message);

    if (isValidMessage.error) {

        return res.sendStatus(422);

    }

    try {

        const mongoClient = new MongoClient(process.env.MONGO_URI);
        await mongoClient.connect();
        const participantsCollection = mongoClient.db('bate-papo-uol-chat').collection('participants');
        const messagesCollection = mongoClient.db('bate-papo-uol-chat').collection('messages');

        const participantNameInUse = await participantsCollection.findOne({ name: from });

        if (!participantNameInUse) {

            return res.sendStatus(422);

        }

        await messagesCollection.insertOne({

            ...message,
            from,
            time: dayjs().format('HH:mm:ss')

        });

        await mongoClient.close();
        res.sendStatus(201);

    } catch (e) {

        res.sendStatus(500);
        
    }

});


app.get('/messages', async (req, res) => {

    const messagesCap = (req.query.limit);
    const participant = req.headers.user;

    try {

        const mongoClient = new MongoClient(process.env.MONGO_URI);
        await mongoClient.connect();
        
        const messagesCollection = mongoClient.db('bate-papo-uol-chat').collection('messages');
        const messages = await messagesCollection.find({}).toArray(); 

        const usersMessages = messages.filter((message) => {

            filterUsersMessages(message, participant);

        });

        await mongoClient.close();

        if (messagesCap !== null) {
            
            return res.send(usersMessages);

        }

        res.send(usersMessages);
    
    } catch (e) {

        console.log(e);
        res.sendStatus(500);

    }

});


app.listen(5000, () => {

    console.log('RODANDO');

});