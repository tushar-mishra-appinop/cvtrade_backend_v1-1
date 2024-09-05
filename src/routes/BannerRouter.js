const express = require('express');
const router = express.Router()
const BannerController = require('../controllers').BannerController
const {upload} = require('../utils/Imageupload');

router 
    
    .post('/v1/admin/add_banner',[upload.single('banner_image')], BannerController.add_banner)

    .get('/v1/admin/banner_list', BannerController.get_banner_list)

    .put('/v1/admin/set_banner_status', BannerController.set_banner_status)

    .delete('/v1/admin/delete-banner/:id', BannerController.delete_banner)




module.exports = router