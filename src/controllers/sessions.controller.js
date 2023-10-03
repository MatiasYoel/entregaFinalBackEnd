import { generateToken } from '../config/config.jwt.js'
import { transport } from '../utils/mailer.js'
import { userService } from '../services/index.js'
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { createHash, isValidPassword } from '../utils.js';

const gitHubCallBack = (req, res) => {
    try {

        const user = {
            name: `${req.user.first_name} ${req.user.last_name}`,
            role: req.user.role,
            id: req.user.id,
            email: req.user.email,
            cart: req.user.carts
        }


        const access_token = generateToken(user)

        return res.cookie('authToken', access_token, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,

        }).sendSuccessGitHub('Incio de Sesion exitoso')
    } catch (error) {
        return res.sendInternalError(error);
    }

}

const loginPost = async (req, res) => {
    try {

        const user = {
            name: `${req.user.first_name} ${req.user.last_name}`,
            role: req.user.role,
            id: req.user.id,
            email: req.user.email,
            cart: req.user.carts
        }

        userService.updateLastConnectionService(user.id)

        const access_token = generateToken(user)

        return res.cookie('authToken', access_token, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,

        }).sendSuccessUser({ userRole: user.role, email:user.email })
    } catch (error) {
        return res.sendInternalError(error);
    }

}

const registerPost = async (req, res) => {
    try {
        return res.sendSuccessUserCreate('Usuario registrado exitosamente')
    } catch (error) {
        return res.sendInternalError(error);
    }
}

const postLogOut = (req, res) => {

    try {
        userService.updateLastConnectionService(req.user.id)
        return res.clearCookie('authToken').sendSuccess('Sesion cerrada exitosamente')
    } catch (error) {
        return res.sendInternalError(error);
    }
}


const currentSession = (req, res) => {
    try {
        return res.sendSuccess(req.user);

    } catch (error) {
        return res.sendInternalError(error);
    }
}

const getMail = async (req, res) => {
    try {
        let result = await transport.sendMail({
            from: 'Matias ',
            to: 'fernandezmatiasyoel@gmail.com',
            subject: 'Prueba Tu Pilcha',
            html: '<h1>Tu Pilcha</h1>',
            attachments: []
        })

        res.sendSuccessWithPayload(result);
    } catch (error) {
        return res.sendInternalError(error);
    }
}

const restoreRequest = async (req, res) => {
    try {
        const { email } = req.body;
    if (!email) return res.sendBadRequest('Proporciona un Email');
    const user = await userService.getUsersByEmailService(email);
    if (!user) return res.sendBadRequest('Email Invalido');
    const restoreToken = jwt.sign(user.toObject(), config.secretKey, {expiresIn: '1h'});

    const html = `<div>
                    <h1>Restablecer Contraseña</h1>
                    <p>Restablece tu Contraseña <a href="${config.url}/restorePassword?token=${restoreToken}">en este Link</a></p>
                    </div>`
    const result = await transport.sendMail({
        from: 'Tu Pilcha',
        to: user.email,
        subject: 'Restablecer Contraseña',
        html: html,
        attachments: []
    })

    res.sendSuccess('send email')
    } catch (error) {
        res.sendInternalError(error)
    }
    
}

const restorePassword = async (req, res) => {
    const { password, passwordRepeat, token } = req.body;
    try {
        if (password !== passwordRepeat) return res.sendBadRequest('Contraseña Incorrecta');

        const tokenUser = jwt.verify(token, config.secretKey);
        const user = await userService.getUsersByEmailService(tokenUser.email);

        const newHashedPassword = createHash(password)

        const isSamePassword = isValidPassword(user, password)
        if (isSamePassword) return res.sendBadRequest('Tu contraseña es igual');
        
        await userService.updatePasswordService(tokenUser.email, newHashedPassword);

        res.sendSuccess("Contraseña cambiada");
    } catch (error) {
        res.sendInternalError(error)
    }
}

export default {
    gitHubCallBack,
    loginPost,
    registerPost,
    postLogOut,
    currentSession,
    getMail,
    restoreRequest,
    restorePassword,
}