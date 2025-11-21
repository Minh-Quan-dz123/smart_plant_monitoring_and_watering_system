package com.example.project_iot_auto_watering.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.viewpager2.widget.ViewPager2
import com.example.project_iot_auto_watering.databinding.FragmentHomeContainerBinding
import androidx.core.view.get
import com.example.project_iot_auto_watering.R



class HomeContainerFragment : Fragment(){
    private var _binding: FragmentHomeContainerBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapterPager: HomePagerAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeContainerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupViewPager()
        setupBottomNav()
    }

    private fun setupViewPager() {
        adapterPager = HomePagerAdapter(this)
        binding.viewPager2.adapter = adapterPager


        //lưu để lướt mượt hơn ko cần load
        binding.viewPager2.offscreenPageLimit = 3

        //khi lướt cập nhật bottom navigation
        binding.viewPager2.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                binding.bottomNavi.menu[position].isChecked = true
            }
        })
    }

    private fun setupBottomNav() {
        binding.bottomNavi.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> binding.viewPager2.setCurrentItem(0, true)
                R.id.nav_sensor -> binding.viewPager2.setCurrentItem(1, true)
                R.id.nav_more -> binding.viewPager2.setCurrentItem(2, true)
            }
            true
        }
    }
}