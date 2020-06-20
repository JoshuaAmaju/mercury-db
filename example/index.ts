import db, { q, assign } from "./database";
import { h } from "./utils";

enum Categories {
  ALL = "all",
  COMPLETED = "compeleted",
  UNCOMPLETED = "uncompeleted",
}

let category = Categories.ALL;

const app = document.getElementById("app");
const fab = document.querySelector(".fab") as HTMLElement;
const form = document.querySelector("form") as HTMLElement;
const todos = document.querySelector(".todos") as HTMLElement;
const modal = document.querySelector(".modal") as HTMLElement;
const categories = document.querySelectorAll(".categories input");

const input = form.querySelector("input") as HTMLInputElement;
const close = modal.querySelector(".close-form") as HTMLButtonElement;

(async () => {
  db.onUpgrade(async ({ schema }) => {
    await schema.install();
  });

  await db.connect();

  await populateTodos();

  fab.addEventListener("click", () => {
    modal.classList.add("open");
    modal.focus();
  });

  close.addEventListener("click", () => {
    input.value = "";
    modal.classList.remove("open");
  });

  categories.forEach((item) => {
    item.addEventListener("change", () => {
      category = item.id as Categories;
      todos.innerHTML = "";
      populateTodos();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = input.value;

    const query = q`CREATE``(t:Todo ${{ title }})``[]``()`;
    const res = await db.exec(query, { return: ["t"] });
    const { id, status } = res["t"];

    const newTask = createTask(id, title, status);
    todos.appendChild(newTask);
    close.click();
  });
})();

function createTask(id: string, title: string, status: string) {
  const props = { id, type: "checkbox" };

  if (status === "completed") {
    props["checked"] = true;
  }

  const statusText = h("p", `status: ${status}`);

  const checkBox = h("input", {
    ...props,
    async onChange(e) {
      const { target } = e;
      const { id, checked } = target;
      const parent = target.parentNode;
      const status = checked ? "completed" : "uncompleted";

      const query = q`MATCH``(t:Todo ${{ id }})``[]``()`;

      await db.exec(query, {
        set: {
          t: assign({ status }),
        },
      });

      parent.classList.toggle("uncompleted");
      todos.innerHTML = "";
      populateTodos();
    },
  });

  const task = h("li", { class: ["todo", status].join(" ") }, [
    checkBox,
    h("div", [h("h2", title), h("div", [statusText])]),
  ]);

  return task;
}

async function populateTodos() {
  app.classList.add("loading");

  const length = todos.childElementCount;

  let query;

  if (category === Categories.ALL) {
    query = q`MATCH``(t:Todo)``[]``()`;
  } else {
    query = q`MATCH``(t:Todo ${{ status: category }})``[]``()`;
  }

  const res = (await db.exec(query, {
    skip: length,
    return: "t",
  })) as unknown[];

  const fragment = document.createDocumentFragment();

  res.forEach((item) => {
    const { id, title, status } = item["t"];
    const task = createTask(id, title, status);
    fragment.appendChild(task);
  });

  app.classList.remove("loading");
  todos.appendChild(fragment);
}
