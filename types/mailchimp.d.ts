declare module "@mailchimp/mailchimp_marketing" {
  interface Mailchimp {
    setConfig: (config: { apiKey: string; server: string }) => void;
    ping: { get: () => Promise<unknown> };
    lists: {
      addListMember: (listId: string, body: { email_address: string; status: string; merge_fields?: Record<string, string> }) => Promise<unknown>;
      setListMember: (listId: string, subscriberHash: string, body: Record<string, unknown>) => Promise<unknown>;
      deleteListMember: (listId: string, subscriberHash: string) => Promise<unknown>;
    };
  }
  const def: Mailchimp;
  export default def;
}
