const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportApiController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/', controller.listReports);
router.get('/my', (req, res) => {
	req.query.mine = 'true';
	return controller.listReports(req, res);
});
router.post('/', controller.createReport);
router.get('/:id', controller.getReport);
router.put('/:id/verify', requireAdmin, controller.setStatus);
router.put('/:id', requireAdmin, controller.setStatus);
router.delete('/:id', controller.deleteReport);

module.exports = router;
