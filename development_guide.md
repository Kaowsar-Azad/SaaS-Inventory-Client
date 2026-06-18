# একদম নতুনদের জন্য প্রজেক্ট ডেভেলপমেন্ট গাইড (Beginner Friendly SaaS Guide)

আপনি যেহেতু প্রতিটি কম্পোনেন্ট, ফোল্ডার স্ট্রাকচার এবং লগইন লজিক একদম বিস্তারিতভাবে জানতে চেয়েছেন, তাই আমি গাইডটিকে আরও ভেঙে এবং সহজ করে নিচে বর্ণনা করলাম। 

---

## ১. প্রজেক্টের ফাইল এবং ফোল্ডার স্ট্রাকচার (কীভাবে সাজাবেন)

আপনার ফ্রন্টএন্ড (Next.js) প্রজেক্টের ফোল্ডারগুলো ঠিক এইভাবে সাজাবেন, যাতে কোড বুঝতে এবং খুঁজে পেতে সুবিধা হয়:

```text
src/
├── app/                      (এখানে সব পেজ বা স্ক্রিন থাকবে)
│   ├── login/page.js         (লগইন করার পেজ)
│   ├── register/page.js      (নতুন কোম্পানি খোলার পেজ)
│   │
│   ├── admin/                (সুপার অ্যাডমিনের জন্য আলাদা ফোল্ডার)
│   │   ├── layout.js         (অ্যাডমিনের সাইডবার ও হেডার)
│   │   ├── dashboard/page.js (অ্যাডমিনের ড্যাশবোর্ড)
│   │
│   ├── dashboard/            (রেগুলার কোম্পানির জন্য ফোল্ডার)
│   │   ├── layout.js         (কোম্পানির সাইডবার ও হেডার)
│   │   ├── page.js           (কোম্পানির ড্যাশবোর্ড)
│   │   ├── products/page.js  (প্রোডাক্ট লিস্ট এবং অ্যাড পেজ)
│   │   └── sales/page.js     (সেলস লিস্ট এবং অ্যাড পেজ)
│
├── components/               (ছোট ছোট অংশ যেগুলো বারবার ব্যবহার হবে)
│   ├── Sidebar.jsx           (কোম্পানির সাইডবার)
│   ├── AdminSidebar.jsx      (সুপার অ্যাডমিনের সাইডবার)
│   ├── Header.jsx            (উপরের ন্যাপবার বা হেডার)
```

---

## ২. ভিন্ন ভিন্ন ড্যাশবোর্ডের লজিক (Role-based Routing)

আপনার একটি দারুণ প্রশ্ন ছিল: **"আমি লগইন করলে এক ড্যাশবোর্ড আসবে, আর অন্য ইউজার লগইন করলে আরেক ড্যাশবোর্ড আসবে—এটা কীভাবে করবো?"**

এটি মূলত লগইন পেজ থেকে কন্ট্রোল করতে হয়। ব্যাকএন্ড যখন ইউজারের তথ্য পাঠায়, তখন তার সাথে ইউজারের `role` বা পদবিও পাঠিয়ে দেয়। লগইন পেজে আমরা সেই রোলটি চেক করি:

**লগইন পেজের লজিক (`src/app/login/page.js`):**

```javascript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // ব্যাকএন্ডের কাছে ইমেইল ও পাসওয়ার্ড পাঠানো হচ্ছে
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // টোকেন এবং ইউজারের তথ্য লোকাল স্টোরেজে সেভ করা হলো
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      // ⭐️ আসল লজিক: রোল অনুযায়ী ভিন্ন পেজে পাঠানো ⭐️
      if (data.role === "super_admin") {
        router.push("/admin/dashboard"); // সুপার অ্যাডমিন ড্যাশবোর্ডে যাবে
      } else {
        router.push("/dashboard");       // কোম্পানির মালিক বা স্টাফ হলে রেগুলার ড্যাশবোর্ডে যাবে
      }
    } else {
      alert("ইমেইল বা পাসওয়ার্ড ভুল!");
    }
  };

  return (
    <form onSubmit={handleLogin}>
       <input type="email" onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
       <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
       <button type="submit">লগইন করুন</button>
    </form>
  );
}
```

---

## ৩. নতুন কিছু "Add" বা যোগ করার লজিক (Form Submission)

আপনি জানতে চেয়েছিলেন **"অ্যাড (Add) করার বিষয়টি কীভাবে কাজ করে?"**
ধরা যাক, আপনি একটি নতুন প্রোডাক্ট অ্যাড করতে চান। এর জন্য ফ্রন্টএন্ডে একটি ফর্ম বানাতে হবে এবং সেটি সাবমিট করলে ব্যাকএন্ডে ডেটা পাঠাতে হবে।

**Add Product এর উদাহরণ (`src/app/dashboard/products/page.js`):**

```javascript
"use client";
import { useState } from "react";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  // সেভ বাটনে ক্লিক করলে এই ফাংশনটি কল হবে
  const handleAddProduct = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token"); // সিকিউরিটির জন্য টোকেন নেওয়া হলো

    // ব্যাকএন্ডের কাছে POST রিকুয়েস্টের মাধ্যমে ডেটা পাঠানো হচ্ছে
    const res = await fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // ব্যাকএন্ডকে বলছি "আমি সঠিক ইউজার"
      },
      body: JSON.stringify({ name: name, price: price, stock: stock })
    });

    if (res.ok) {
      alert("প্রোডাক্ট সফলভাবে অ্যাড হয়েছে!");
      // ফর্মটি খালি করে দেওয়া হলো
      setName(""); setPrice(""); setStock("");
    } else {
      alert("প্রোডাক্ট অ্যাড করতে সমস্যা হয়েছে!");
    }
  };

  return (
    <div>
      <h2>নতুন প্রোডাক্ট যোগ করুন</h2>
      <form onSubmit={handleAddProduct}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="প্রোডাক্টের নাম" required />
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="দাম" required />
        <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="স্টক (কয় পিস আছে)" required />
        
        <button type="submit">Save Product (অ্যাড করুন)</button>
      </form>
    </div>
  );
}
```

---

## সামারি (আপনার জন্য টিপস):

1. **Components এর ব্যবহার:** `Sidebar` এবং `Header` কে আলাদা `components/` ফোল্ডারে রাখলে সুবিধা হলো, আপনি যেকোনো পেজে শুধু `<Sidebar />` লিখে দিলে পুরো সাইডবারটি সেখানে চলে আসবে। বারবার কোড লিখতে হবে না।
2. **Layout এর সুবিধা:** `app/dashboard/layout.js` ফাইলে আপনি যদি সাইডবারটি যুক্ত করে দেন, তবে ড্যাশবোর্ডের ভেতরের সব পেজে (Products, Sales) স্বয়ংক্রিয়ভাবে সাইডবারটি দেখা যাবে।
3. **Role Checker:** ড্যাশবোর্ডের লেআউটে একটি চেক বসাতে পারেন, যাতে কোনো ইউজার যদি সুপার অ্যাডমিন হয়, তবে সে ভুলে কোম্পানির পেজে আসলে তাকে আবার অ্যাডমিন পেজে পাঠিয়ে দেওয়া যায়।

এই স্ট্রাকচার এবং লজিকগুলো একটি প্রফেশনাল এবং স্ট্যান্ডার্ড প্রজেক্টে ব্যবহার করা হয়। আপনি এই ফ্লো অনুযায়ী কাজ করলে কোনো কনফিউশন ছাড়াই প্রজেক্ট দাঁড় করাতে পারবেন!
