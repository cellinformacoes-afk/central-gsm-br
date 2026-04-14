
const ASAAS_API_KEY = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjRkZmQ3OWI2LTc5NjAtNDk5OS04ODI2LTU4ZGRjMGY0N2U2Njo6JGFhY2hfMjU2MTFiNjgtZGIyMy00YmY3LTgyMmYtY2JmMWM4NGQ1MzVj";
const ASAAS_API_URL = "https://api.asaas.com/v3";
const userId = "2b3d5256-5f23-4132-974b-f5bbd3c7cd22"; // From previous logs

async function debug() {
  const url = `${ASAAS_API_URL}/payments?externalReference=${userId}`;
  console.log('Fetching:', url);
  const response = await fetch(url, {
    headers: { 'access_token': ASAAS_API_KEY }
  });
  const data = await response.json();
  console.log('Total Payments:', data.totalCount);
  data.data.forEach(p => {
    console.log(`Payment ID: ${p.id}, Value: ${p.value}, Status: ${p.status}, Created: ${p.dateCreated}`);
  });
}

debug();
