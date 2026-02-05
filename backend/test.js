require("dotenv").config();
const supabase = require("./supabaseClient");

async function test() {
  const { data, error } = await supabase
    .from("products")
    .select("product_name")
    .limit(1);

  if (error) {
    console.error("❌ Supabase connection failed", error);
  } else {
    console.log("✅ Supabase connected:", data);
  }
}

test();
