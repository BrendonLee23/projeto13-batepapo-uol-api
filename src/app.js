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

app.listen(5000, () => {

    console.log('RODANDO');

});