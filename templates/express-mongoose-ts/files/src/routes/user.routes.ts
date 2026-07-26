import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { validateWith } from "../middlewares/validate";
import { createUserSchema, updateUserSchema } from "../validations/joi/user.validation";

const router = Router();

router.get("/", userController.listUsers);
router.get("/:id", userController.getUserById);
router.post("/", validateWith(createUserSchema), userController.createUser);
router.patch("/:id", validateWith(updateUserSchema), userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
