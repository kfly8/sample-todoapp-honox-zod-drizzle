import { desc, eq } from "drizzle-orm";
import { deleteCookie, getCookie } from "hono/cookie";
import type { PropsWithChildren } from "hono/jsx";
import { createRoute } from "honox/factory";

import { createDrizzle } from "@/infra";
import { todos } from "@/infra/schema";
import { verifyToken } from "@/token";

import HeaderIsland from "@/islands/HeaderIsland";
import TodoIsland from "@/islands/TodoIsland";

export const GET = createRoute(async (c) => {
	const token = getCookie(c, "token");

	if (token === undefined) {
		return c.redirect("/signup");
	}

	const result = await verifyToken(token);
	if (result.isErr()) {
		deleteCookie(c, "token");
		return c.text("Unauthorized", 401);
	}

	const user = result.value.user;

	// Move to query namespace if it gets too complicated
	const db = createDrizzle();
	const rows = await db
		.select({
			id: todos.id,
			title: todos.title,
			completed: todos.completed,
			authorId: todos.authorId,
		})
		.from(todos)
		.where(eq(todos.authorId, user.id))
		.orderBy(desc(todos.createdAt));

	return c.render(
		<Layout>
			<HeaderIsland user={user} />
			<TodoIsland user={user} todos={rows} />
		</Layout>,
		{ title: "Todo App" },
	);
});

const Layout = ({ children }: PropsWithChildren) => {
	return (
		<div class="max-w-sm mx-auto mt-10 bg-white shadow-md rounded-lg p-6">
			{children}
		</div>
	);
};
