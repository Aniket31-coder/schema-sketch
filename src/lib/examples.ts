export const EXAMPLES: { name: string; description: string; source: string }[] = [
  {
    name: "Minimal",
    description: "Two entities and a one-to-many relationship.",
    source: `erDiagram
CUSTOMER {
  int    id   [PK]
  string name
}
ORDER {
  int  id          [PK]
  int  customer_id [FK]
  date placed_at
}
CUSTOMER ||--o{ ORDER : "places"`,
  },
  {
    name: "Webshop",
    description: "A small e-commerce schema with products, orders, and line items.",
    source: `erDiagram
CUSTOMER {
  int     id          [PK]
  string  email       [UK]
  string  name
  date    created_at
}
PRODUCT {
  int     id          [PK]
  string  sku         [UK]
  string  name
  decimal price
}
ORDER {
  int     id          [PK]
  int     customer_id [FK]
  date    placed_at
  string  status
}
LINE_ITEM {
  int     id          [PK]
  int     order_id    [FK]
  int     product_id  [FK]
  int     quantity
  decimal unit_price
}
CUSTOMER ||--o{ ORDER : "places"
ORDER    ||--|{ LINE_ITEM : "contains"
PRODUCT  ||--o{ LINE_ITEM : "appears in"`,
  },
  {
    name: "Blog",
    description: "Posts, authors, comments, and tags — many-to-many included.",
    source: `erDiagram
AUTHOR {
  int    id    [PK]
  string name
  string email [UK]
}
POST {
  int       id        [PK]
  int       author_id [FK]
  string    title
  text      body
  timestamp published_at
}
COMMENT {
  int       id         [PK]
  int       post_id    [FK]
  string    author_name
  text      body
  timestamp created_at
}
TAG {
  int    id   [PK]
  string name [UK]
}
AUTHOR  ||--o{ POST    : "writes"
POST    ||--o{ COMMENT : "has"
POST    }o--o{ TAG     : "tagged with"`,
  },
];
