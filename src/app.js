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