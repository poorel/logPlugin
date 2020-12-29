<template>
  <el-form ref="form" :model="form" label-width="180px">
    <el-form-item label="是否关闭所有监听">
      <el-switch v-model="form.lister1"></el-switch>
    </el-form-item>
    <el-form-item label="需要监听的页面域名">
      <el-input type="textarea" placeholder="多个url以英文逗号分割，不填则监听所有页面" v-model="form.urlName"></el-input>
    </el-form-item>
    <el-form-item label="是否关闭ajax监听">
      <el-switch v-model="form.lister2"></el-switch>
    </el-form-item>
    <el-form-item label="需要监听的ajax地址">
      <el-input type="textarea" placeholder="多个url以英文逗号分割，不填则监听所有ajax请求" v-model="form.urlAjax"></el-input>
    </el-form-item>
<!--    <el-form-item label="借口发送形式">-->
<!--      <el-switch v-model="form.lister2"></el-switch>-->
<!--    </el-form-item>-->
    <el-form-item label="日志记录地址">
      <el-input v-model="form.logUrl"></el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">保存</el-button>
<!--      <el-button>取消</el-button>-->
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      form: {
        lister1: false,
        lister2: true,
        urlName: '',
        urlAjax: '',
        logUrl: '',
      }
    }
  },
  methods: {
    onSubmit() {
      let form = this.data.form
      let {lister1, logUrl} = form
      if(lister1 && !logUrl){
        if (chrome) {
          chrome.notifications.create(null, {
            title: '提示',
            message: '警告，启用监听却未配置日志记录地址!',
          });
        }
        return ;
      }
      if (chrome) {
        chrome.storage.sync.set({_form: form}, () => {
          chrome.notifications.create(null, {
            title: '提示',
            message: '设置成功',
          });
          window.reload();
        });
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
