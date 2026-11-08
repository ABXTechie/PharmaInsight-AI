// Single source of truth for the app's existing routes, grouped for the sidebar.
export const navGroups = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", path: "/dashboard", icon: "dashboard" }],
  },
  {
    label: "Operations",
    items: [
      { name: "Sales", path: "/sales", icon: "receipt" },
      { name: "Customers", path: "/customers", icon: "users" },
      { name: "Products", path: "/products", icon: "pill" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { name: "Buying Patterns", path: "/patterns", icon: "activity" },
      { name: "Reports", path: "/reports", icon: "report" },
      { name: "AI Assistant", path: "/ai", icon: "sparkles", badge: "AI" },
    ],
  },
];

// Breadcrumb trail for the current pathname.
export const getBreadcrumbs = (pathname) => {
  const [section, sub, action] = pathname.split("/").filter(Boolean);
  const item = navGroups
    .flatMap((group) => group.items)
    .find((navItem) => navItem.path === `/${section}`);

  if (!item) return [];

  const crumbs = [{ name: item.name, path: item.path }];

  if (sub === "new") crumbs.push({ name: "Record sale" });
  else if (sub) {
    crumbs.push({
      name: section === "sales" ? "Sale details" : "Details",
      path: action ? `/${section}/${sub}` : undefined,
    });
  }

  if (action === "edit") crumbs.push({ name: "Edit" });

  return crumbs;
};
