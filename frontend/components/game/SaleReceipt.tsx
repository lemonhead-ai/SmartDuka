"use client";

import type { Basket, Reward } from "@/features/gameplay/types";

type ReceiptDetails = {
  shopName: string;
  customerName: string;
  basket: Basket;
  reward: Reward | null;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export function printSaleReceipt({ shopName, customerName, basket, reward }: ReceiptDetails): void {
  const receiptWindow = window.open("", "_blank", "popup,width=420,height=720");
  if (!receiptWindow) return;

  const saleTime = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  const lines = basket.lines.map((line) => `<tr><td>${line.quantity} × ${escapeHtml(line.item.name)}</td><td>KES ${line.line_total_kes}</td></tr>`).join("");
  const rewards = reward ? `<div class="rewards"><span>+${reward.coins} coins</span><span>+${reward.xp} XP</span><span>+${reward.stars} stars</span></div>` : "";

  receiptWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Smart Duka receipt</title><style>@page{size:80mm auto;margin:8mm}*{box-sizing:border-box}body{margin:0;background:#f1f1f1;color:#151515;font-family:"Courier New",Courier,monospace}.receipt{width:80mm;margin:18px auto;background:#fff;padding:24px 20px;box-shadow:0 4px 20px rgba(0,0,0,.18)}.brand{text-align:center}.mark{display:inline-grid;width:40px;height:40px;place-items:center;border-radius:50%;background:#0b6b45;color:#fff;font-family:Arial,sans-serif;font-size:22px;font-weight:800}.brand h1{margin:10px 0 4px;font-family:Arial,sans-serif;font-size:21px;letter-spacing:.04em}.muted{color:#5d5d5d;font-size:12px;line-height:1.55}.divider{border:0;border-top:2px dashed #b7b7b7;margin:18px 0}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:#5d5d5d;font-size:11px;padding-bottom:8px}th:last-child,td:last-child{text-align:right}td{padding:7px 0;vertical-align:top}.total{display:flex;justify-content:space-between;font-weight:800;font-size:17px;margin-top:6px}.rewards{display:flex;justify-content:space-between;gap:4px;border:1px solid #bfe4cf;border-radius:9px;background:#f0faf4;padding:9px 7px;color:#075b35;font-size:11px;font-weight:700;text-align:center}.footer{text-align:center;margin-top:19px;font-size:12px;line-height:1.55}@media print{body{background:#fff}.receipt{width:auto;margin:0;padding:0;box-shadow:none}}</style></head><body><main class="receipt"><header class="brand"><span class="mark">S</span><h1>${escapeHtml(shopName)}</h1><p class="muted">Sale receipt<br>${saleTime}<br>Customer: ${escapeHtml(customerName)}</p></header><hr class="divider" /><table><thead><tr><th>ITEM</th><th>AMOUNT</th></tr></thead><tbody>${lines}</tbody></table><hr class="divider" /><div class="total"><span>TOTAL</span><span>KES ${basket.total_kes}</span></div>${rewards ? `<hr class="divider" />${rewards}` : ""}<p class="footer">Thank you for learning and growing with Smart Duka!</p></main><script>window.onload=()=>{window.focus();window.print();}</script></body></html>`);
  receiptWindow.document.close();
}
