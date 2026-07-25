import type { Basket, BasketValidation, Customer, InventoryItem, LiteracyChallenge } from "@/features/gameplay/types";

type BasketLine = Basket["lines"][number];

function issue(item: { item_id: string; name: string; quantity: number }, selectedQuantity: number) {
  return { item_id: item.item_id, name: item.name, expected_quantity: item.quantity, selected_quantity: selectedQuantity };
}

export function validateLocalBasket(customer: Customer, lines: BasketLine[]): BasketValidation {
  const selected = new Map(lines.map((line) => [line.item.id, line]));
  const requested = new Map(customer.requested_items.map((item) => [item.item_id, item]));
  const missing_items = customer.requested_items.filter((item) => !selected.has(item.item_id)).map((item) => issue(item, 0));
  const quantity_mismatches = customer.requested_items
    .filter((item) => selected.has(item.item_id) && selected.get(item.item_id)?.quantity !== item.quantity)
    .map((item) => issue(item, selected.get(item.item_id)?.quantity ?? 0));
  const unexpected_items = lines.filter((line) => !requested.has(line.item.id)).map((line) => ({
    item_id: line.item.id, name: line.item.name, expected_quantity: 0, selected_quantity: line.quantity,
  }));

  const tutor_feedback = unexpected_items.length && missing_items.length
    ? `Almost! You picked ${unexpected_items[0].name.toLowerCase()}, but ${customer.name} asked for ${missing_items[0].name.toLowerCase()}.`
    : missing_items.length
      ? `You still need ${missing_items[0].expected_quantity} ${missing_items[0].name.toLowerCase()}.`
      : quantity_mismatches.length
        ? `${customer.name} needs ${quantity_mismatches[0].expected_quantity} ${quantity_mismatches[0].name.toLowerCase()}, but the basket has ${quantity_mismatches[0].selected_quantity}.`
        : unexpected_items.length
          ? `${customer.name} did not ask for ${unexpected_items[0].name.toLowerCase()}. Try removing it.`
          : `Excellent! The basket is exactly what ${customer.name} requested.`;

  return {
    is_valid: !missing_items.length && !quantity_mismatches.length && !unexpected_items.length,
    missing_items, unexpected_items, quantity_mismatches, tutor_feedback,
  };
}

function build(customer: Customer, lines: BasketLine[], current: Basket | null, literacyChallenge?: LiteracyChallenge | null): Basket {
  return {
    lines,
    total_kes: lines.reduce((total, line) => total + line.line_total_kes, 0),
    validation: validateLocalBasket(customer, lines),
    literacy_challenge: literacyChallenge !== undefined ? literacyChallenge : (current?.literacy_challenge ?? null),
    request_version: customer.request_version,
  };
}

export function addLocalBasketItem(
  customer: Customer,
  current: Basket | null,
  item: InventoryItem,
  literacyChallenge?: LiteracyChallenge | null
): Basket | null {
  const lines = current?.lines ?? [];
  const existing = lines.find((line) => line.item.id === item.id);
  if (existing?.quantity === item.stock) return null;
  const nextLines = existing
    ? lines.map((line) => line.item.id === item.id
      ? { ...line, quantity: line.quantity + 1, line_total_kes: (line.quantity + 1) * item.price_kes }
      : line)
    : [...lines, { item, quantity: 1, line_total_kes: item.price_kes }];
  return build(customer, nextLines, current, literacyChallenge);
}

export function removeLocalBasketItem(
  customer: Customer,
  current: Basket | null,
  itemId: string,
  literacyChallenge?: LiteracyChallenge | null
): Basket {
  return build(customer, (current?.lines ?? []).filter((line) => line.item.id !== itemId), current, literacyChallenge);
}
