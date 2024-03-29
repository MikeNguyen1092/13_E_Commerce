const router = require("express").Router();
const { Product, Category, Tag, ProductTag } = require("../../models");

// The `/api/products` endpoint

// get all products
router.get("/", async (req, res) => {
	try {
		const productData = await Product.findAll({
			include: [{ model: Category, model: Tag }],
		});
		res.status(200).json(productData);
	} catch (err) {
		res.status(500).json(err);
	}
});

// get one product
router.get("/:id", async (req, res) => {
	// find a single product by its `id`
	try {
		const productData = await Product.findByPk(req.params.id, {
			include: [{ model: Category, model: Tag }],
		});
		if (!productData) {
			res.status(404).json({ message: "No product found with that id!" });
			return;
		}
		res.status(200).json(productData);
	} catch (err) {
		res.status(500).json(err);
	}
});

// create new product
router.post("/", async (req, res) => {
	try {
		// Create the product
		const product = await Product.create(req.body);

		// If there are product tags, create pairings in the ProductTag model
		if (req.body.tag_id && req.body.tag_id.length) {
			const productTagIdArr = req.body.tag_id.map((tag_id) => ({
				product_id: product.id,
				tag_id,
			}));
			await ProductTag.bulkCreate(productTagIdArr);
		}

		res.status(200).json(product);
	} catch (err) {
		console.error(err);
		res.status(500).json(err);
	}
});

// update product
router.put("/:id", async (req, res) => {
	// update product data
	try {
		await Product.update(req.body, {
			where: {
				id: req.params.id,
			},
		});

		const productTags = await ProductTag.findAll({
			where: { product_id: req.params.id },
		});
		// create filtered list of new tag_ids
		const productTag_id = productTags.map(({ tag_id }) => tag_id);
		const newProductTags = req.body.tag_id
			.filter((tag_id) => !productTag_id.includes(tag_id))
			.map((tag_id) => ({
				product_id: req.params.id,
				tag_id,
			}));

		// figure out which ones to remove
		const productTagsToRemove = productTags.filter(({ tag_id }) => !req.body.tag_id.includes(tag_id)).map(({ id }) => id);
		// run both actions
		await Promise.all([ProductTag.destroy({ where: { id: productTagsToRemove } }), ProductTag.bulkCreate(newProductTags)]);

		const updateProduct = await Product.findByPk(req.params.id);
		res.status(200).json(updateProduct);
	} catch (err) {
		res.status(500).json(err);
	}
});

router.delete("/:id", async (req, res) => {
	// delete one product by its `id` value
	try {
		const productData = await Product.destroy({
			where: { id: req.params.id },
		});
		res.status(200).json(productData);
	} catch (err) {
		res.status(500).json(err);
	}
});

module.exports = router;
