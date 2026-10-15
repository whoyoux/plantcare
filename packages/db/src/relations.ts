import { defineRelations } from 'drizzle-orm';

import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    identifications: r.many.identification(),
  },
  session: { user: r.one.user({ from: r.session.userId, to: r.user.id }) },
  account: { user: r.one.user({ from: r.account.userId, to: r.user.id }) },
  identification: { user: r.one.user({ from: r.identification.userId, to: r.user.id }) },
}));
