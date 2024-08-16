import type { APIRoute } from "astro";
import getIcons from "../../lib/getIcons";
import { MAX_ITEMS } from "../../lib/search";
import type { Icon } from "../../types/Icon";

export const prerender = false;

const icons = getIcons();

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);

  let count = parseInt(params.count ?? "1");
  if (isNaN(count)) count = 9999;
  count = Math.max(0, Math.min(count, MAX_ITEMS));

  const randomIcons: Icon[] = [];
  for (let i = 0; i < count; i++) {
    const icon = icons[Math.floor(Math.random() * icons.length)]!;
    if (icon) randomIcons.push(icon);
  }

  return new Response(JSON.stringify(randomIcons), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
