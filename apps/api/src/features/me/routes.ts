import { factory } from '../../env';
import { requireUser } from '../../middleware/require-user';

export const meRoutes = factory
  .createApp()
  .use(requireUser)
  .get('/', (c) => {
    const { id, name, email } = c.var.user;
    return c.json({ id, name, email });
  });
