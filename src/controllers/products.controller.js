
import { productService } from '../services/index.js';
import CustomError from '../services/errors/customErrors.js'
import EErrors from '../services/errors/enums.js';
import { generateProductErrorInfo } from '../services/errors/constant.js';
import fs from 'fs';
import path from 'path';
import { transport } from "../utils/mailer.js";

const getProductsAdmin = async (req, res) => {

}

const getProducts = async (req, res) => {
    try {
        let { limit, page, sort, category, filterStock } = req.query

        if (filterStock) {
            try {
                const products = await productService.getProductsViewService()
                const filterByStock = products.filter(product => product.stock <= Number(filterStock))
                return res.sendSuccessWithPayload(filterByStock);
            } catch (error) {
                req.logger.error(error);
                return res.sendInternalError(error);
            }
        }

        const options = {
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            sort: { price: Number(sort) }
        };

        if (!(options.sort.price === -1 || options.sort.price === 1)) {
            delete options.sort
        }

        if (req.user.role === 'ADMIN') {
            const allProducts = await productService.getProductsViewService()
            return res.sendSuccessWithPayload(allProducts)
        }

        const links = (products) => {
            let prevLink;
            let nextLink;
            if (req.originalUrl.includes('page')) {
                prevLink = products.hasPrevPage ? req.originalUrl.replace(`page=${products.page}`, `page=${products.prevPage}`) : null;
                nextLink = products.hasNextPage ? req.originalUrl.replace(`page=${products.page}`, `page=${products.nextPage}`) : null;
                return { prevLink, nextLink };
            }
            if (!req.originalUrl.includes('?')) {
                prevLink = products.hasPrevPage ? req.originalUrl.concat(`?page=${products.prevPage}`) : null;
                nextLink = products.hasNextPage ? req.originalUrl.concat(`?page=${products.nextPage}`) : null;
                return { prevLink, nextLink };
            }
            prevLink = products.hasPrevPage ? req.originalUrl.concat(`&page=${products.prevPage}`) : null;
            nextLink = products.hasNextPage ? req.originalUrl.concat(`&page=${products.nextPage}`) : null;
            return { prevLink, nextLink };
        }

        const categories = await productService.categoriesService()

        const result = categories.some(categ => categ === category)
        if (result) {
            const products = await productService.getProductsService({ category }, options);
            const { prevLink, nextLink } = links(products);
            const { totalPages, prevPage, nextPage, hasNextPage, hasPrevPage, docs } = products
            const docsFiltered = docs.filter(prod => prod.owner !== req.user.email)
            req.logger.debug('Get Product OK')

            return res.status(200).send({ status: 'success', payload: docsFiltered, totalPages, prevPage, nextPage, hasNextPage, hasPrevPage, prevLink, nextLink });
        }

        const products = await productService.getProductsService({}, options);

        const { totalPages, prevPage, nextPage, hasNextPage, hasPrevPage, docs } = products

        const { prevLink, nextLink } = links(products);
        const docsFiltered = docs.filter(prod => prod.owner !== req.user.email)

        req.logger.debug('Get Product OK')

        return res.status(200).send({ status: 'success', payload: docsFiltered, totalPages, prevPage, nextPage, hasNextPage, hasPrevPage, prevLink, nextLink });
    } catch (error) {
        req.logger.error(error)
        return (error);
    }


}

const getProductId = async (req, res) => {
    try {
        const { pid } = req.params

        const result = await productService.getProductByIdService(pid)

        if (result === null || typeof (result) === 'string') return res.status(404).send({ status: 'error', message: `El producto con ID: ${pid} no se encontro` })

        req.logger.debug('GET product ID OK')
        return res.status(200).send(result);

    } catch (error) {
        req.logger.error(error)
        return (error);
    }

}

const postProduct = async (req, res) => {

    try {
        let product = req.body

        product.owner = (req.user.role !== 'premium') ? 'admin' : req.user.email;
        if (req.files) {
            product.thumbnails = req.files.map(file => file.path);
        }

        product.price = Number(product.price[0])
        product.stock = Number(product.stock[0])
        product.status = (product.status[0] === 'on') ? true : false;

        const {
            title,
            description,
            price,
            code,
            stock,
            status,
            category,
            thumbnails,
            owner,
        } = product

        if (!title ||
            !description ||
            !price ||
            !code ||
            !stock ||
            !status ||
            !category ||
            !thumbnails ||
            !owner) {

            CustomError.createError({
                name: 'Product creation failed',
                cause: generateProductErrorInfo(
                    {
                        title,
                        description,
                        price,
                        code,
                        stock,
                        status,
                        category,
                        thumbnails,
                        owner,
                    }
                ),
                message: "Error trying to create product",
                code: EErrors.INVALID_TYPES_ERROR
            })

        }


        if (!(typeof title === 'string' &&
            typeof description === 'string' &&
            typeof price === 'number' &&
            typeof code === 'string' &&
            typeof stock === 'number' &&
            typeof status === 'boolean' &&
            typeof category === 'string' &&
            typeof owner === 'string' &&
            Array.isArray(thumbnails)))
            return res.status(400).send({ message: 'Tipo de propiedad Invalido' })

        if (price < 0 || stock < 0) return res
            .status(400)
            .send({ message: 'Stock de producto igual a 0' });

        const result = await productService.addProductService(product)

        if (result.code === 11000) return res
            .status(400)
            .send({ message: `E11000 duplicate key error collection: ecommerce.products dup key code: ${result.keyValue.code}` });
        req.logger.debug('POST product OK')
        return res.status(201).send(result);

    }
    catch (error) {

        req.logger.error(error)
        return res.send(error);

    }
}

const putProduct = async (req, res) => {
    try {
        const { pid } = req.params
        const product = req.body

        if (product.price < 0 || product.stock < 0) return res.sendInternalError('El precio o el Stock es negativo!')

        const result = await productService.updateProductService(pid, product);

        if (result.message) return res.status(404).send({ message: `ID: ${pid} no encontrado` })
        req.logger.debug(`El producto ${result.title} con ID: ${result._id} fue actualizado`)
        return res.status(200).send(`El producto ${result.title} con ID: ${result._id} fue actualizado`);
    }
    catch (error) {
        req.logger.error(error)
        return res.send({ message: error });
    };

}

const deleteProduct = async (req, res) => {

    try {
        const { pid } = req.params
        const product = await productService.getProductByIdService(pid)

        if (!(product.owner !== req.user.email || req.user.role === 'ADMIN')) return res.sendInternalError('No puede eliminar este producto,acceso denegado')
        const result = await productService.deleteProductService(pid)

        if (!result) return res.status(404).send({ message: `ID: ${pid} no encontrado` })
        if (product.owner !== 'admin') {
            const html = `<div>
                        <h1>Producto Eliminado, Titulo: ${product.title}</h1>
                        <p>Producto Eliminado</p>
                        </div>`
            const sendEmail = await transport.sendMail({
                from: 'Tu pilcha',
                to: product.owner,
                subject: 'Producto Eliminado',
                html: html,
                attachments: []
            })
        }
        req.logger.debug(`ID: ${pid} fue eliminado`)

        return res.sendSuccess(`ID: ${pid} fue eliminado`);

    } catch (error) {

        req.logger.error(error)
        return res.internalError(error.message)
    }
}

const getProductsFromPremium = async (req, res) => {
    try {
        const products = await productService.getProductsViewService()
        const filteredProducts = products.filter(product => product.owner === req.user.email)
        res.sendSuccessWithPayload(filteredProducts)

    } catch (error) {

        req.logger.error(error)
        return res.internalError(error.message)
    }
}

export default {
    getProducts,
    getProductId,
    postProduct,
    putProduct,
    deleteProduct,
    getProductsFromPremium
}