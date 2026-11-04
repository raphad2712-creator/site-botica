import { Icon } from "@/components/ui-icon";

const detalhes: Array<[RegExp, string[]]> = [
  [/creatina/i, ["Monohidratada", "Em pó", "300 g"]],
  [/floral rescue/i, ["Fórmula floral", "Frasco conta-gotas", "30 ml"]],
  [/testo\s*\+/i, ["Fórmula composta", "Com zinco", "30 cápsulas"]],
  [/b12|metilcobalamina/i, ["Metilcobalamina", "Vitamina B12", "30 cápsulas"]],
  [/vit(?:amina)?\s*d/i, ["1000 UI", "Vitamina D", "30 cápsulas"]],
  [/magn[eé]sio/i, ["5 fontes de magnésio", "30 doses", "60 cápsulas"]],
  [/passiflora/i, ["Extrato vegetal", "Em cápsulas", "Linha natural"]],
  [/isoflavona/i, ["Isoflavona", "Em cápsulas", "Linha natural"]],
  [/turkesterone/i, ["Turkesterone", "Em cápsulas", "Linha natural"]],
  [/saw palmetto/i, ["Saw Palmetto", "Em cápsulas", "Linha natural"]],
  [/berberina/i, ["Berberina", "Em cápsulas", "Linha natural"]],
  [/glucomanan/i, ["Glucomanan", "Em cápsulas", "Linha natural"]],
  [/tribulus/i, ["Tribulus terrestris", "Em cápsulas", "Linha natural"]],
  [/maca peruana/i, ["Maca peruana", "Em cápsulas", "Linha natural"]],
];

export function CatalogCardDetails({ nome, apresentacao }: { nome: string; apresentacao?: string }) {
  const highlights = detalhes.find(([pattern]) => pattern.test(nome))?.[1] ?? [
    "Seleção Botica",
    "Informações no rótulo",
    apresentacao || "Consulte detalhes",
  ];
  return (
    <ul className="mockup-highlights" aria-label={`Características de ${nome}`}>
      {highlights.map((item, index) => (
        <li key={item}>
          <span className="mockup-highlight-icon" aria-hidden="true">
            <Icon name={index === 0 ? "leaf" : index === 1 ? "check" : "package"} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CartGlyph() {
  return <Icon name="shopping-cart" />;
}
