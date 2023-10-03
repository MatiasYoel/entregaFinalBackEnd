import { passportCall } from '../middleware/auth.js';
import viewsControllers from '../controllers/views.controllers.js';
import BaseRouter from "./Router.js";



export default class ViewsRouter extends BaseRouter {

    init() {
        this.get('/admin', ['ADMIN'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getAdminView) 
        
        this.get('/register', ['PUBLIC'], passportCall('register', {strategyType: 'login'}), viewsControllers.getRegisterView)

        this.get('/login', ['PUBLIC', 'ADMIN'], passportCall('login', {strategyType: 'login'}), viewsControllers.getLoginView)

        this.get('/', ['PUBLIC', 'ADMIN'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getIndexView) 

        this.get('/forbidden', ['PUBLIC', 'ADMIN'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.forbiddenView) 

        this.get('/premium', ['ADMIN', 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.premiumView)

        this.get('/carts', ['AUTH', "USER", 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getCartsView) 

        this.get('/viewGitHub', ['AUTH', "USER"], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getGitHubView) 

        this.get('/products', ['LOGIN', "USER", 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getProductsView) 

        this.get('/products/inCart', ['AUTH', "USER", 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getProductsInCart) 
        
        this.get('/carts/:cid', ['AUTH', "USER", 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getCartIdView) 
                
        this.get('/profile', ['AUTH', "USER", 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getProfileView) 
        
        this.get('/ticket', ['AUTH', "USER", 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getTicketView)

        this.get('/allTickets', ['AUTH', "USER", 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.getAllTicketView)

        this.post('/products', ['AUTH', "USER", 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.postProductsView) 

        this.get('/mockingproducts', ['AUTH', "USER"], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.generateProductView) 
        
        this.get('/restoreRequest', ['PUBLIC'], passportCall('jwt', {strategyType: 'jwt'}), viewsControllers.restoreRequestView) 

        this.get('/restorePassword', ['NO_AUTH'], passportCall('jwt', { strategyType: "jwt" }), viewsControllers.restorePasswordView) 
        
        this.get('/allUsers', ['ADMIN'], passportCall('jwt', { strategyType: "jwt" }), viewsControllers.userViews)
    }

}

