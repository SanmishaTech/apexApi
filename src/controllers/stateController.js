const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const { z } = require("zod");
const createError = require("http-errors");
const bcrypt = require("bcryptjs");

/**
 * Wrap async route handlers and funnel errors through Express error middleware.
 * Converts Prisma validation errors and known request errors into structured 400 responses.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Zod or manual user errors forwarded by validateRequest
    if (err.status === 400 && err.expose) {
      return res
        .status(400)
        .json({ errors: err.errors || { message: err.message } });
    }
    // Prisma validation errors
    if (err.name === "PrismaClientValidationError") {
      return res.status(400).json({ errors: { message: err.message } });
    }
    // Prisma known request errors (e.g., unique constraint)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002" && err.meta?.target) {
        const field = Array.isArray(err.meta.target)
          ? err.meta.target[0]
          : err.meta.target;
        const message = `A record with that ${field} already exists.`;
        return res
          .status(400)
          .json({ errors: { [field]: { type: "unique", message } } });
      }
    }
    // Fallback for unexpected errors
    console.error(err);
    return res
      .status(500)
      .json({ errors: { message: "Internal Server Error" } });
  });
};


const getStates = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const { search = "", sortBy = "stateName", sortOrder = "asc" } = req.query;

  // Map frontend sort field "name" to database column "stateName"
  const mappedSortBy = sortBy === "name" ? "stateName" : sortBy;

  const where = search
    ? {
        stateName: { contains: search }
      }
    : {};

  const [states, total] = await Promise.all([
    prisma.states.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [mappedSortBy]: sortOrder },
      select: {
        id: true,
        stateName: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.states.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    states,
    page,
    totalPages,
    totalStates: total,
  });
});

const getState = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid state ID");

  const state = await prisma.states.findUnique({
    where: { id },
    select: {
      id: true,
      stateName: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!state) throw createError(404, "State not found");

  res.json(state);
});

const createState = asyncHandler(async (req, res) => {
  const schema = z.object({
    stateName: z.string().min(1, "State name is required").max(255),
  });

  // Will throw Zod errors caught by asyncHandler
  const validatedData = await schema.parseAsync(req.body);

  // Create the state
  const state = await prisma.states.create({
    data: {
      stateName: validatedData.stateName,
    } 
  });

  res.status(201).json(state);
});

const updateState = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid state ID");

  const schema = z
    .object({
      stateName: z.string().min(1).max(255).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    });

  const validatedData = await schema.parseAsync(req.body);

  const existing = await prisma.states.findUnique({ where: { id } });
  if (!existing) throw createError(404, "State not found");

  // Remove undefined fields
  let dataToUpdate = { ...validatedData };
  Object.keys(dataToUpdate).forEach(key => {
    if (dataToUpdate[key] === undefined) {
      delete dataToUpdate[key];
    }
  });

  const updated = await prisma.states.update({
    where: { id },
    data: dataToUpdate,
  });

  res.json(updated);
});

const deleteState = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) throw createError(400, "Invalid state ID");

  const existing = await prisma.states.findUnique({ where: { id } });
  if (!existing) throw createError(404, "State not found");

  await prisma.states.delete({ where: { id } });
  res.json({ message: "State deleted successfully" });
});

module.exports = {
  getStates,
  createState,
  getState,
  updateState,
  deleteState,
};
