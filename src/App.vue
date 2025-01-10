<script >
    import NAVBAR from './components/Navbar.vue';
    import axios from 'axios';
    export default {
         components:{
            NAVBAR
         },
          mounted() {
          
            const api = import.meta.env.VITE_PATH;
            const api_dev = import.meta.env.VITE_TEXT;
            const api_pro = import.meta.env.VITE_PRO; //只有在npm run build 正式環境才會顯示
            console.log(api,api_dev,api_pro);
            this.$http.get(api)
              .then((res) => {
                console.log(res); // 讀取 data 屬性
              
              })
              .catch(error => {
                console.error('Error:', error); // 加入錯誤處理
              })
          }
    }

  



</script>

<template>
  <NAVBAR></NAVBAR>

  <RouterView />
</template>

<style lang="scss" scoped >

</style>
