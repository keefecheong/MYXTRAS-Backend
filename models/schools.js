const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    identifier: {
        type: [Object],
        default: {
            "BA": "Business & Accountancy",
            "DE": "Design & Environment",
            "SoE": "Engineering",
            "FMS": "Film & Media Studies",
            "HS": "Health Sciences",
            "HMS": "Humanities & Social Sciences",
            "ICT": "InfoComm Technology",
            "LSCT": "Life Sciences & Chemical Technology"
        }
    },
    courses: {
        type: [Object],
        default: {
            "BA": {
                "ACC": "Accountancy",
                "BF": "Banking & Finance",
                "BS": "Business Studies",
                "ITB": "International Trade & Business",
                "TRM": "Tourism & Resort Management",
                "CBP": "Common Business Programme"
            },
            "DE": {
                "DES": "Design",
                "HLFM": "Hotel & Leisure Facilities Management",
                "REB": "Real Estate Business"
            },
            "SoE": {
                "AEG": "Aerospace Engineering",
                "BME": "Biomedical Engineering",
                "EE": "Electrical Engineering",
                "ECE": "Electronic & Computer Engineering",
                "ES": "Engineering Science",
                "MOT": "Marine & Offshore Technology",
                "ME": "Mechanical Engineering",
                "MR": "Mechatronics & Robotics",
                "CEP": "Common Engineering Programme"
            },
            "FMS": {
                "FSV": "Film, Sound & Video",
                "MCM": "Mass Communication",
                "MPP": "Media Post-Production",
                "CMP": "Common Media Programme"
            },
            "HS": {
                "NSG": "Nursing",
                "OPT": "Optometry"
            },
            "HMS": {
                "ABM": "Arts Business Management",
                "CMC": "Chinese Media & Communication",
                "CHS": "Chinese Studies",
                "CDT": "Community Development",
                "ECDE": "Early Childhood Development & Education",
                "TSE": "Tamil Studies with Early Education"
            },
            "ICT": {
                "CSF": "Cybersecurity & Digital Forensics",
                "DS": "Data Science",
                "IM": "Immersive Media",
                "IT": "Information Technology",
                "CICTP": "Common ICT Programme"
            },
            "LSCT": {
                "BMS": "Biomedical Science",
                "CBE": "Chemical & Biomolecular Engineering",
                "EWT": "Environmental & Water Technology",
                "LDH": "Landscape Design & Horticulture",
                "PHARM": "Pharmaceutical Science",
                "CSP": "Common Science Programme"
            },
        }
    }
});

module.exports = mongoose.model('School', schoolSchema);