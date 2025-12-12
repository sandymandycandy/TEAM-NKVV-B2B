# B2B Marketplace

A robust application connecting vendors and buyers, facilitating seamless wholesale transactions.

## Features

### For Vendors
*   **Dashboard**: Real-time sales overview, revenue tracking, and order statistics.
*   **Inventory Management**: Add, update, and manage products with inventory tracking.
*   **Order Management**: Process orders, update statuses (Pending, Shipped, Delivered), and view details.
*   **Profile**: Manage business details and documents.

### For Buyers
*   **Product Discovery**: Browse a wide range of products across categories.
*   **Purchasing**: Add items to cart and place orders efficiently.
*   **Order History**: Track past and current orders with detailed status updates.
*   **Dashboard**: Personalized overview of recent activity and spending.

## Tech Stack

*   **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (for styling).
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB.
*   **Authentication**: JWT (JSON Web Tokens).

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    *   Create a `.env` file in the root directory.
    *   Add your MongoDB URI and JWT Secret:
        ```env
        MONGO_URI=mongodb://localhost:27017/scubeg_db
        JWT_SECRET=your_jwt_secret_key
        ```
4.  Seed the database (IMPORTANT for first run):
    ```bash
    node scripts/seed-data.js
    ```
5.  Start the server:
    ```bash
    node server.js
    ```
6.  Access the application at `http://localhost:3000`.

## Login Credentials (Seeded Data)

**Password for ALL accounts:** `Password123`

### Vendors
*   `sharmatraders@gmail.com`
*   `gujaratspice@business.com`
*   `mumbaifresh@vendor.in`
*   `southindiaagro@gmail.com`

### Buyers
*   `metrosupermart@gmail.com`
*   `royal.restaurants@business.com`
*   `chennaifoodhub@buyer.in`
*   `punjabwholesale@gmail.com`
*   `kolkatagrocers@business.com`


## Team Members
*   **S SURAJ**
*   **S SANDEEP KUMAR**
*   **GROWISH CHANDRAN**
*   **SAI DEEVAN**
