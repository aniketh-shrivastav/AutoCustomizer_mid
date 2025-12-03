# Redux Integration Guide for Seller Pages

## Overview
This guide explains how to integrate Redux state management into the AutoCustomizer seller pages with error/loading handling and data persistence.

## What's Been Set Up

### 1. **Redux Store** (`src/redux/store.js`)
- Configured with Redux Persist for local storage
- Automatically rehydrates on app start
- Tracks: dashboard, orders, products, profile

### 2. **Redux Slices** (Async State Management)
- **`sellerDashboardSlice.js`** - Dashboard stats, alerts, recent orders
- **`sellerOrdersSlice.js`** - Order list, status updates
- **`sellerProductsSlice.js`** - Product list, delete operations
- **`sellerProfileSlice.js`** - Profile settings, form updates

### 3. **Features Included**
✅ Async thunks for API calls  
✅ Loading state tracking  
✅ Error handling & display  
✅ Data persistence (localStorage)  
✅ Optimistic updates  
✅ Redux DevTools integration  

---

## Installation

1. **Install dependencies** (if not already done):
```bash
cd client
npm install
```

2. **Environment**: Redux and redux-persist are in `package.json`

---

## File Structure
```
client/src/
├── redux/
│   ├── store.js                  # Redux store + persist config
│   ├── sellerDashboardSlice.js   # Dashboard reducer & actions
│   ├── sellerOrdersSlice.js      # Orders reducer & actions
│   ├── sellerProductsSlice.js    # Products reducer & actions
│   ├── sellerProfileSlice.js     # Profile reducer & actions
│   └── hooks.js                  # Custom Redux hooks
├── pages/seller/
│   ├── Dashboard.jsx              # (old - fetch-based)
│   ├── DashboardRedux.jsx         # (new - Redux example)
│   ├── Orders.jsx                 # (to be migrated)
│   ├── ProductManagement.jsx      # (to be migrated)
│   └── ProfileSettings.jsx        # (to be migrated)
└── App.jsx                         # Redux Provider + PersistGate
```

---

## How to Use Redux in Components

### Example 1: **Using Redux in Dashboard**

```jsx
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard, clearError } from '../redux/sellerDashboardSlice';

export default function SellerDashboard() {
  const dispatch = useDispatch();
  const { totalSales, loading, error } = useSelector(state => state.sellerDashboard);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return <div>Total Sales: {totalSales}</div>;
}
```

### Example 2: **Handling Async Actions (e.g., Update Order)**

```jsx
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/sellerOrdersSlice';

function OrderRow({ order }) {
  const dispatch = useDispatch();

  const handleUpdate = () => {
    dispatch(updateOrderStatus({
      orderId: order.orderId,
      newStatus: 'delivered',
      productId: order.productId,
      itemIndex: order.itemIndex
    }))
    .unwrap()
    .then(() => alert('Updated!'))
    .catch(err => alert(`Error: ${err}`));
  };

  return <button onClick={handleUpdate}>Mark Delivered</button>;
}
```

### Example 3: **Error Handling**

```jsx
import { clearError } from '../redux/sellerDashboardSlice';

export default function Dashboard() {
  const { error } = useSelector(state => state.sellerDashboard);
  const dispatch = useDispatch();

  return error ? (
    <div style={{ background: '#fee', padding: '10px' }}>
      {error}
      <button onClick={() => dispatch(clearError())}>Dismiss</button>
    </div>
  ) : null;
}
```

---

## Redux State Structure

### Dashboard State
```js
{
  totalSales: number,
  totalEarnings: number,
  totalOrders: number,
  stockAlerts: [],
  recentOrders: [],
  statusDistribution: {},
  loading: boolean,
  error: string | null,
  lastUpdated: ISO8601 string | null
}
```

### Orders State
```js
{
  orders: [],
  loading: boolean,
  error: string | null,
  updating: { [key]: boolean },  // Tracks which orders are being updated
  lastUpdated: ISO8601 string | null
}
```

### Products State
```js
{
  products: [],
  loading: boolean,
  error: string | null,
  deleting: { [productId]: boolean },
  lastUpdated: ISO8601 string | null
}
```

### Profile State
```js
{
  profile: {
    storeName: string,
    ownerName: string,
    contactEmail: string,
    phone: string,
    address: string
  },
  loading: boolean,
  updating: boolean,
  error: string | null,
  success: boolean,
  lastUpdated: ISO8601 string | null
}
```

---

## Data Persistence

Redux data automatically persists to localStorage under these keys:
- `seller-dashboard`
- `seller-orders`
- `seller-products`
- `seller-profile`

**Note**: Loading/error/updating flags are NOT persisted (reset on app load).

To manually clear persisted data:
```js
import { persistor } from './redux/store';
persistor.purge();
```

---

## Migrating Existing Pages to Redux

### Step 1: Replace fetch logic
**Before** (old Orders.jsx):
```jsx
const [orders, setOrders] = useState([]);
useEffect(() => {
  fetch('/seller/api/orders')
    .then(res => res.json())
    .then(data => setOrders(data.orders));
}, []);
```

**After** (Redux):
```jsx
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../redux/sellerOrdersSlice';

const dispatch = useDispatch();
const { orders, loading } = useSelector(state => state.sellerOrders);

useEffect(() => {
  dispatch(fetchOrders());
}, [dispatch]);
```

### Step 2: Update action handlers
**Before**:
```jsx
const handleUpdate = async () => {
  await fetch(`/seller/orders/${id}/status`, { ... });
};
```

**After**:
```jsx
const handleUpdate = () => {
  dispatch(updateOrderStatus({ orderId: id, newStatus, ... }));
};
```

### Step 3: Add error displays
```jsx
const { error } = useSelector(state => state.sellerOrders);
if (error) return <ErrorAlert message={error} onDismiss={() => dispatch(clearError())} />;
```

---

## Async Thunks Available

### Dashboard
- `fetchDashboard()` - Load dashboard stats

### Orders
- `fetchOrders()` - Load all seller orders
- `updateOrderStatus(payload)` - Update single order status

### Products
- `fetchProducts()` - Load seller products
- `deleteProduct(productId)` - Delete a product

### Profile
- `fetchProfileSettings()` - Load profile form data
- `updateProfileSettings(profileData)` - Update profile

---

## Common Patterns

### Refresh Data After Update
```jsx
const handleUpdate = () => {
  dispatch(updateOrderStatus(payload))
    .unwrap()
    .then(() => dispatch(fetchOrders()))  // Refresh
    .catch(err => console.error(err));
};
```

### Show Loading Spinner
```jsx
const { loading, error, orders } = useSelector(state => state.sellerOrders);

if (loading) return <Spinner />;
if (error) return <ErrorMessage />;
return <OrderList orders={orders} />;
```

### Disable Button During Update
```jsx
const { updating } = useSelector(state => state.sellerOrders);
const isUpdating = updating[`${orderId}-${productId}`];

<button disabled={isUpdating}>
  {isUpdating ? 'Updating...' : 'Update'}
</button>
```

---

## Redux DevTools Integration

If you have Redux DevTools extension installed in your browser:
1. Open DevTools (browser inspector)
2. Look for "Redux" tab
3. See all actions, state changes, and time-travel debug

---

## Next Steps

1. ✅ Dashboard updated (see `DashboardRedux.jsx`)
2. ⏳ Migrate `Orders.jsx` to use `useSelector(state => state.sellerOrders)`
3. ⏳ Migrate `ProductManagement.jsx` to use `sellerProducts` slice
4. ⏳ Migrate `ProfileSettings.jsx` to use `sellerProfile` slice

Each migration follows the same pattern:
- Replace `useState` + `fetch` with `useDispatch` + `useSelector`
- Replace error state with Redux error handling
- Add loading indicators using Redux loading flag

---

## Troubleshooting

**Q: Data not persisting?**  
A: Check browser localStorage (DevTools > Application > Local Storage). Keys should start with `persist:`.

**Q: Seeing "Loading..." indefinitely?**  
A: Check Console for API errors. Verify fetch URLs and server is running.

**Q: Redux DevTools not showing?**  
A: Install browser extension "Redux DevTools" and reload.

**Q: Stale data showing?**  
A: Check `lastUpdated` timestamp. Force refresh with `dispatch(fetchXXX())`.

---

## Questions?
Refer to [Redux Toolkit Docs](https://redux-toolkit.js.org/) or Redux Persist guide.
