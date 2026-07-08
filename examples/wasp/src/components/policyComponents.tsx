import type { PolicyComponents } from "@policystack/react/policy";

// The policy renderer walks the compiled document tree and hands each node to
// the component registered for its slot, so the policies render through the
// app's own components. Any slot left out falls back to the built-in default.
export const policyComponents: PolicyComponents = {
  Section: ({ node, children }) => (
    <section className="policy-section" id={node.id}>
      {children}
    </section>
  ),
  Heading: ({ node }) => <h2 className="policy-heading">{node.value}</h2>,
  Paragraph: ({ children }) => <p className="policy-paragraph">{children}</p>,
  List: ({ children }) => <ul className="policy-list">{children}</ul>,
  Table: ({ children }) => <table className="policy-table">{children}</table>,
  TableHeaderCell: ({ children }) => <th className="policy-cell">{children}</th>,
  TableCell: ({ children }) => <td className="policy-cell">{children}</td>,
};
