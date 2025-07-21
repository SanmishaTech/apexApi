const express = require("express");
const stateController = require("../controllers/stateController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: States
 *   description: State management endpoints
 */

/**
 * @swagger
 * /states:
 *   get:
 *     summary: Get all states
 *     tags: [States]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all states
 */
router.get("/", auth, stateController.getStates);

/**
 * @swagger
 * /states/{id}:
 *   get:
 *     summary: Get a state by ID
 *     tags: [States]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: State ID
 *     responses:
 *       200:
 *         description: State data
 *       404:
 *         description: State not found
 */
router.get("/:id", auth, stateController.getState);

/**
 * @swagger
 * /states:
 *   post:
 *     summary: Create a new state
 *     tags: [States]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/State'
 *     responses:
 *       201:
 *         description: State created
 */
router.post("/", auth, stateController.createState);

/**
 * @swagger
 * /states/{id}:
 *   put:
 *     summary: Update a state by ID
 *     tags: [States]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: State ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/State'
 *     responses:
 *       200:
 *         description: State updated
 *       404:
 *         description: State not found
 */
router.put("/:id", auth, stateController.updateState);

/**
 * @swagger
 * /states/{id}:
 *   delete:
 *     summary: Delete a state by ID
 *     tags: [States]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: State ID
 *     responses:
 *       200:
 *         description: State deleted
 *       404:
 *         description: State not found
 */
router.delete("/:id", auth, stateController.deleteState);

module.exports = router;
