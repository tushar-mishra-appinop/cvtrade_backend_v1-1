const Banner = require('../models/Banner');

module.exports = {
    add_banner: async (req, res) => {
        try {

            let { banner_type, banner_sequence, banner_text } = req.body;

            let banner_image


            if (req.file != undefined) {
                banner_image = `uploads/${req.file.filename}`
            } else {
                return res.status(406).json({
                    success: false,
                    message: "Please attach a Banner Image",
                    data: []
                });
            }


            let list = {};
            list = req.body;
            list.banner_type = banner_type,
                list.banner_sequence = banner_sequence,
                list.banner_text = banner_text,
                list.banner_path = banner_image

            let add_banner = await Banner.create(list);

            if (add_banner || add_banner.length > 0) {
                return res.status(200).json({ success: true, message: "Banner added successfully", data: add_banner })
            } else {
                return res.status(400).json({ success: false, message: "Some error occured while adding Banner, Please try again later", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },
    get_banner_list: async (req, res) => {
        try {
            let banner_list = await Banner.find().sort({ banner_sequence: 1 });

            if (banner_list.length > 0) {
                return res.status(200).json({ success: true, message: "Banner list fetched successfully", data: banner_list })
            } else {
                return res.status(200).json({ success: true, message: "No Data Found", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },
    set_banner_status: async (req, res) => {
        try {
            const { _id, status } = req.body;
            let update_status = await Banner.findByIdAndUpdate({ _id: _id }, { status: status }, { new: true })

            if (update_status) {
                return res.status(200).json({ success: true, message: "Status upadated successfully", data: update_status })
            } else {
                return res.status(400).json({ success: false, message: 'Some error occured while updating status', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    delete_banner: async (req, res) => {
        try {
            const { id } = req.params;

            let delete_banner = await Banner.findByIdAndDelete({ _id: id })

            return res.status(200).json({ success: true, message: "Banner Deleted Successfully", data: delete_banner })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })

        }
    },
}