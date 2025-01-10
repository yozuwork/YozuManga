<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <!-- 左側的 Logo -->
            <a class="navbar-brand" href="#">YozuManga</a>

            <!-- 手機版的切換按鈕 -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
           
            </button>
            <!-- 中間的選單與右側按鈕 -->
            <div class="collapse navbar-collapse " id="navbarSupportedContent">
            <!-- 中間選單 -->
            <ul class="navbar-nav ms-auto">
                 <li class="nav-item">
                    <router-link to="/categories" class="nav-link px-3" href="#">分類</router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/news" class="nav-link px-3" href="#">更新</router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/ranking" class="nav-link px-3" href="#">排行</router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/collections" class="nav-link px-3" href="#">我的收藏</router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/about"  class="nav-link px-3" href="#">關於這裡</router-link>
                </li>
              
            </ul>
            <!-- 右側按鈕 -->
            <button class="btn btn-outline-dark ms-3" type="button">登入</button>
            </div>
        </div>
    </nav>
</template>