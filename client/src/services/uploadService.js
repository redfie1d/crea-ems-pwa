/*
Originator:
Date:
Service for call logs upload
*/

import http from "./httpService";

const uploadEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/upload";

export async function uploadFile(file){
    const config ={
        headers:{
            'content-type': 'multipart/form-data'
        }
    }
    let result = await http.post(uploadEndpoint + "/", file, config);
    return result.data;
}

export async function getData(){
    const data = await http.get(uploadEndpoint + "/");
    return data.data;
}

export default{
    uploadFile,
    getData
};
