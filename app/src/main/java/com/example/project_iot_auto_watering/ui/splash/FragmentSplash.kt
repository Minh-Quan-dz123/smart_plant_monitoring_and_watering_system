package com.example.project_iot_auto_watering.ui.splash

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.databinding.FragmentSplashBinding

class FragmentSplash : Fragment(), View.OnClickListener {
    private var _binding: FragmentSplashBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentSplashBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

       initListener()
    }

    private fun initListener(){
        binding.tvStart.setOnClickListener(this)
    }

    override fun onClick(p0: View?) {
        when(p0?.id){
            R.id.tv_start ->{
                findNavController().navigate(R.id.action_splashFragment_to_fragmentLogin)
            }
        }
    }

}