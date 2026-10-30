import LeadDetail from '../../../components/LeadDetail';

// Server wrapper: unwraps the dynamic route param (a promise in Next 15)
// and hands a plain id to the client detail component.
export default async function LeadPage({ params }) {
  const { id } = await params;
  return <LeadDetail leadId={id} />;
}
