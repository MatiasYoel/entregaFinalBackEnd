import { passportCall } from '../middleware/auth.js';
import BaseRouter from './Router.js';
import productsController from '../controllers/products.controller.js';
import upload from "../middleware/multerMiddleware.js";

export default class ProductsRouter extends BaseRouter {

    init() {
        this.get('/', ['AUTH', 'ADMIN', 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), passportCall('jwt', { strategyType: 'github' }), productsController.getProducts)
        
        this.get('/premium', ['AUTH', 'ADMIN', 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), productsController.getProductsFromPremium)

        this.get('/:pid', ['AUTH', 'ADMIN', 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), productsController.getProductId)

        this.post('/', ['ADMIN', 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), upload.array('file', 10), productsController.postProduct)

        this.put('/:pid', ['ADMIN', 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), productsController.putProduct)

        this.patch('/:pid', ['ADMIN', 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), productsController.putProduct)

        this.delete('/:pid', ['ADMIN', 'PREMIUM'], passportCall('jwt', {strategyType: 'jwt'}), productsController.deleteProduct)
    }

}



// export default this